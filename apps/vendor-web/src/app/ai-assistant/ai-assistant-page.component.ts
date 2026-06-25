import { isPlatformBrowser } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    type OnDestroy,
    PLATFORM_ID,
    signal,
} from '@angular/core';
import { LanguageService } from '@brickam/i18n-kit/browser';
import type { BadgeTone } from '@brickam/ui-kit';
import { BadgeComponent, ButtonComponent, SelectComponent } from '@brickam/ui-kit';
import { AiAssistantApiService } from './ai-assistant-api.service';
import type { AiJob, AiJobStatus, AiJobType, CreateAiJobPayload } from './models';

/** Интервал опроса прогресса задач (мс). */
const POLL_MS = 2000;

/**
 * Страница AI-ассистента продавца: форма генерации (описание/картинка/видео)
 * + список задач с прогресс-баром и опросом статуса. Done-задачи image/video
 * можно прикрепить как обложку товара. Опрос — только в браузере, очистка в ngOnDestroy.
 */
@Component({
    selector: 'app-ai-assistant',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonComponent, SelectComponent, BadgeComponent],
    template: `
        <section class="flex flex-col gap-8">
            <h1 class="text-text-primary" style="font: var(--type-display)">
                {{ t('aiAssistant.title') }}
            </h1>

            @if (error()) {
                <p class="text-danger" role="alert">{{ error() }}</p>
            }

            <div class="flex flex-col gap-4 rounded-md p-5 bg-surface-card">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <bh-select
                        [label]="t('aiAssistant.type')"
                        [options]="typeOptions()"
                        [value]="type()"
                        (changed)="setType($event)"
                    />
                    <label class="flex flex-col gap-2 min-w-0 sm:col-span-2">
                        <span class="text-text-secondary" style="font: var(--type-product)">
                            {{ t('aiAssistant.prompt') }}
                        </span>
                        <textarea
                            rows="3"
                            [value]="prompt()"
                            (input)="setPrompt($event)"
                            class="min-w-0 rounded-md border-0 px-5 py-4 bg-[rgb(var(--color-neutral-900)/0.9)] text-text-primary font-input text-18 outline-none shadow-[inset_0_0_0_1px_var(--border-subtle),var(--shadow-inset)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                        ></textarea>
                    </label>
                    <label class="flex flex-col gap-2 min-w-0 sm:col-span-2">
                        <span class="text-text-secondary" style="font: var(--type-product)">
                            {{ t('aiAssistant.productId') }}
                        </span>
                        <input
                            [value]="productId()"
                            (input)="setProductId($event)"
                            class="h-14 min-w-0 rounded-md border-0 px-5 bg-[rgb(var(--color-neutral-900)/0.9)] text-text-primary font-input text-18 outline-none shadow-[inset_0_0_0_1px_var(--border-subtle),var(--shadow-inset)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                        />
                    </label>
                </div>
                <div>
                    <bh-button
                        variant="primary"
                        [disabled]="creating() || !canSubmit()"
                        (clicked)="generate()"
                    >
                        {{ creating() ? t('vendor.common.saving') : t('aiAssistant.generate') }}
                    </bh-button>
                </div>
            </div>

            @if (loading()) {
                <p class="text-text-secondary">{{ t('vendor.common.loading') }}</p>
            } @else if (jobs().length === 0) {
                <p class="text-text-secondary" data-testid="empty">{{ t('aiAssistant.empty') }}</p>
            } @else {
                <ul class="flex flex-col gap-4" data-testid="jobs">
                    @for (j of jobs(); track j.id) {
                        <li class="flex flex-col gap-3 rounded-md p-5 bg-surface-card" data-testid="job">
                            <div class="flex flex-wrap items-center justify-between gap-3">
                                <span class="text-text-primary" style="font: var(--type-heading)">
                                    {{ t('aiAssistant.' + j.type) }}
                                </span>
                                <bh-badge [tone]="statusTone(j.status)">
                                    {{ t('aiAssistant.status.' + j.status) }}
                                </bh-badge>
                            </div>

                            <div class="flex flex-col gap-1">
                                <div class="h-2 w-full rounded-full bg-surface-chip">
                                    <div
                                        class="h-2 rounded-full bg-accent transition-[width] duration-base"
                                        [style.width.%]="j.progress"
                                        data-testid="bar"
                                    ></div>
                                </div>
                                <span class="text-text-tertiary" style="font: var(--type-caption)">
                                    {{ t('aiAssistant.progress') }}: {{ j.progress }}%
                                </span>
                            </div>

                            @if (j.status === 'failed' && j.error) {
                                <p class="text-danger" role="alert">{{ j.error }}</p>
                            }

                            @if (j.status === 'done' && j.result) {
                                <div class="flex flex-col gap-2">
                                    <span class="text-text-secondary" style="font: var(--type-product)">
                                        {{ t('aiAssistant.result') }}
                                    </span>
                                    @if (j.type === 'description') {
                                        <p class="text-text-primary whitespace-pre-wrap" data-testid="result-text">
                                            {{ j.result }}
                                        </p>
                                    } @else if (j.type === 'image') {
                                        <img
                                            [src]="j.result"
                                            [alt]="t('aiAssistant.result')"
                                            class="max-w-xs rounded-md"
                                            data-testid="result-image"
                                        />
                                    } @else {
                                        <video
                                            [src]="j.result"
                                            controls
                                            class="max-w-xs rounded-md"
                                            data-testid="result-video"
                                        ></video>
                                    }
                                </div>
                            }

                            @if (canAttach(j)) {
                                <div>
                                    <bh-button
                                        size="sm"
                                        variant="secondary"
                                        (clicked)="attach(j)"
                                    >
                                        {{ t('aiAssistant.attach') }}
                                    </bh-button>
                                </div>
                            }
                        </li>
                    }
                </ul>
            }
        </section>
    `,
})
export class AiAssistantPageComponent implements OnDestroy {
    private readonly api = inject(AiAssistantApiService);
    private readonly i18n = inject(LanguageService);
    private readonly platformId = inject(PLATFORM_ID);

    protected readonly jobs = signal<AiJob[]>([]);
    protected readonly loading = signal(true);
    protected readonly creating = signal(false);
    protected readonly error = signal<string | null>(null);

    protected readonly type = signal<AiJobType>('description');
    protected readonly prompt = signal('');
    protected readonly productId = signal('');

    /** Активный таймер опроса (только в браузере). */
    private pollTimer: ReturnType<typeof setInterval> | null = null;

    protected readonly typeOptions = computed(() => [
        { label: this.t('aiAssistant.description'), value: 'description' },
        { label: this.t('aiAssistant.image'), value: 'image' },
        { label: this.t('aiAssistant.video'), value: 'video' },
    ]);

    protected readonly canSubmit = computed(() => this.prompt().trim().length > 0);

    constructor() {
        this.api.list().subscribe({
            next: (items) => {
                this.jobs.set(items);
                this.loading.set(false);
                this.syncPolling();
            },
            error: (err) => {
                this.error.set(this.errMsg(err));
                this.loading.set(false);
            },
        });
    }

    ngOnDestroy(): void {
        this.stopPolling();
    }

    protected t(key: string): string {
        return this.i18n.t(key);
    }

    protected setType(value: string | number): void {
        this.type.set(value as AiJobType);
    }

    protected setPrompt(event: Event): void {
        this.prompt.set((event.target as HTMLTextAreaElement).value);
    }

    protected setProductId(event: Event): void {
        this.productId.set((event.target as HTMLInputElement).value);
    }

    protected statusTone(status: AiJobStatus): BadgeTone {
        switch (status) {
            case 'done':
                return 'success';
            case 'failed':
                return 'danger';
            case 'processing':
                return 'accent';
            default:
                return 'neutral';
        }
    }

    protected canAttach(job: AiJob): boolean {
        return (
            job.status === 'done' && (job.type === 'image' || job.type === 'video') && !!job.result
        );
    }

    protected generate(): void {
        if (!this.canSubmit() || this.creating()) {
            return;
        }
        this.creating.set(true);
        this.error.set(null);
        const payload: CreateAiJobPayload = {
            type: this.type(),
            userPrompt: this.prompt().trim(),
        };
        const pid = this.productId().trim();
        if (pid) {
            payload.productId = pid;
        }
        this.api.create(payload).subscribe({
            next: (job) => {
                this.jobs.update((list) => [job, ...list]);
                this.prompt.set('');
                this.creating.set(false);
                this.syncPolling();
            },
            error: (err) => {
                this.error.set(this.errMsg(err));
                this.creating.set(false);
            },
        });
    }

    protected attach(job: AiJob): void {
        this.api.attach(job.id).subscribe({
            next: (updated) => this.upsert(updated),
            error: (err) => this.error.set(this.errMsg(err)),
        });
    }

    /** Запускает/останавливает опрос в зависимости от наличия активных задач. */
    private syncPolling(): void {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }
        if (this.hasActive()) {
            this.startPolling();
        } else {
            this.stopPolling();
        }
    }

    private hasActive(): boolean {
        return this.jobs().some((j) => j.status === 'queued' || j.status === 'processing');
    }

    private startPolling(): void {
        if (this.pollTimer !== null) {
            return;
        }
        this.pollTimer = setInterval(() => this.poll(), POLL_MS);
    }

    private stopPolling(): void {
        if (this.pollTimer !== null) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }

    /** Опрашивает каждую активную задачу. */
    private poll(): void {
        const active = this.jobs().filter(
            (j) => j.status === 'queued' || j.status === 'processing',
        );
        if (active.length === 0) {
            this.stopPolling();
            return;
        }
        for (const job of active) {
            this.api.get(job.id).subscribe({
                next: (updated) => {
                    this.upsert(updated);
                    if (!this.hasActive()) {
                        this.stopPolling();
                    }
                },
                error: () => {},
            });
        }
    }

    /** Обновляет задачу в списке по id. */
    private upsert(job: AiJob): void {
        this.jobs.update((list) => list.map((j) => (j.id === job.id ? job : j)));
    }

    private errMsg(err: unknown): string {
        if (err && typeof err === 'object' && 'error' in err) {
            const body = (err as { error?: { message?: string } }).error;
            if (body?.message) {
                return body.message;
            }
        }
        return this.t('vendor.common.error');
    }
}
