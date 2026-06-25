import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { ButtonComponent, InputComponent } from '@brickam/ui-kit';
import type { Observable } from 'rxjs';
import {
    type DefaultSettings,
    type MediaSettings,
    type SeoSettings,
    SettingsApiService,
} from './settings-api.service';

const TEXTAREA_CLASS =
    'min-w-0 rounded-md border-0 px-5 py-4 bg-[rgb(var(--color-neutral-900)/0.9)] text-text-primary font-input text-18 outline-none shadow-[inset_0_0_0_1px_var(--border-subtle),var(--shadow-inset)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]';

/**
 * Платформенные настройки. Четыре независимые секции, каждая читает
 * GET /admin/settings/:key и сохраняет PUT:
 * - 'default' → комиссия (число) + AI-промпты (description/image/video);
 * - 'media' → лимиты загрузок;
 * - 'seo' → список бот-User-Agent.
 */
@Component({
    selector: 'app-settings',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonComponent, InputComponent],
    template: `
        <section class="flex flex-col gap-10">
            <h1 class="text-text-primary" style="font: var(--type-display)">
                {{ t('admin.settings.title') }}
            </h1>

            @if (error()) {
                <p class="text-danger" role="alert">{{ error() }}</p>
            }
            @if (saved()) {
                <p class="text-success" role="status">{{ t('admin.settings.saved') }}</p>
            }

            <!-- Комиссия -->
            <div class="flex flex-col gap-4 rounded-md p-5 bg-surface-card">
                <h2 class="text-text-primary" style="font: var(--type-heading)">
                    {{ t('admin.settings.commission.title') }}
                </h2>
                <bh-input
                    type="number"
                    class="max-w-xs"
                    [label]="t('admin.settings.commission.percent')"
                    [value]="commission()"
                    (changed)="commission.set($event)"
                />
                <div>
                    <bh-button variant="primary" [disabled]="saving()" (clicked)="saveDefault()">
                        {{ saving() ? t('admin.common.saving') : t('admin.common.save') }}
                    </bh-button>
                </div>
            </div>

            <!-- AI-промпты -->
            <div class="flex flex-col gap-4 rounded-md p-5 bg-surface-card">
                <h2 class="text-text-primary" style="font: var(--type-heading)">
                    {{ t('admin.settings.ai.title') }}
                </h2>
                <label class="flex flex-col gap-2 min-w-0">
                    <span class="text-text-secondary" style="font: var(--type-product)">
                        {{ t('admin.settings.ai.description') }}
                    </span>
                    <textarea
                        rows="3"
                        [value]="aiDescription()"
                        (input)="setText(aiDescription, $event)"
                        [class]="taClass"
                    ></textarea>
                </label>
                <label class="flex flex-col gap-2 min-w-0">
                    <span class="text-text-secondary" style="font: var(--type-product)">
                        {{ t('admin.settings.ai.image') }}
                    </span>
                    <textarea
                        rows="3"
                        [value]="aiImage()"
                        (input)="setText(aiImage, $event)"
                        [class]="taClass"
                    ></textarea>
                </label>
                <label class="flex flex-col gap-2 min-w-0">
                    <span class="text-text-secondary" style="font: var(--type-product)">
                        {{ t('admin.settings.ai.video') }}
                    </span>
                    <textarea
                        rows="3"
                        [value]="aiVideo()"
                        (input)="setText(aiVideo, $event)"
                        [class]="taClass"
                    ></textarea>
                </label>
                <div>
                    <bh-button variant="primary" [disabled]="saving()" (clicked)="saveDefault()">
                        {{ saving() ? t('admin.common.saving') : t('admin.common.save') }}
                    </bh-button>
                </div>
            </div>

            <!-- Медиа-лимиты -->
            <div class="flex flex-col gap-4 rounded-md p-5 bg-surface-card">
                <h2 class="text-text-primary" style="font: var(--type-heading)">
                    {{ t('admin.settings.media.title') }}
                </h2>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <bh-input
                        type="number"
                        [label]="t('admin.settings.media.maxImage')"
                        [value]="maxImage()"
                        (changed)="maxImage.set($event)"
                    />
                    <bh-input
                        type="number"
                        [label]="t('admin.settings.media.maxVideo')"
                        [value]="maxVideo()"
                        (changed)="maxVideo.set($event)"
                    />
                    <bh-input
                        type="number"
                        [label]="t('admin.settings.media.maxImages')"
                        [value]="maxImages()"
                        (changed)="maxImages.set($event)"
                    />
                </div>
                <div>
                    <bh-button variant="primary" [disabled]="saving()" (clicked)="saveMedia()">
                        {{ saving() ? t('admin.common.saving') : t('admin.common.save') }}
                    </bh-button>
                </div>
            </div>

            <!-- Бот-User-Agent (SEO) -->
            <div class="flex flex-col gap-4 rounded-md p-5 bg-surface-card">
                <h2 class="text-text-primary" style="font: var(--type-heading)">
                    {{ t('admin.settings.seo.title') }}
                </h2>
                <label class="flex flex-col gap-2 min-w-0">
                    <span class="text-text-secondary" style="font: var(--type-product)">
                        {{ t('admin.settings.seo.botUserAgents') }}
                    </span>
                    <textarea
                        rows="5"
                        [value]="botUserAgents()"
                        (input)="setText(botUserAgents, $event)"
                        [class]="taClass"
                    ></textarea>
                </label>
                <div>
                    <bh-button variant="primary" [disabled]="saving()" (clicked)="saveSeo()">
                        {{ saving() ? t('admin.common.saving') : t('admin.common.save') }}
                    </bh-button>
                </div>
            </div>
        </section>
    `,
})
export class SettingsComponent {
    private readonly api = inject(SettingsApiService);
    private readonly i18n = inject(LanguageService);

    protected readonly taClass = TEXTAREA_CLASS;

    protected readonly commission = signal('0');
    protected readonly aiDescription = signal('');
    protected readonly aiImage = signal('');
    protected readonly aiVideo = signal('');
    protected readonly maxImage = signal('0');
    protected readonly maxVideo = signal('0');
    protected readonly maxImages = signal('0');
    protected readonly botUserAgents = signal('');

    protected readonly saving = signal(false);
    protected readonly saved = signal(false);
    protected readonly error = signal<string | null>(null);

    constructor() {
        this.api.get<DefaultSettings>('default').subscribe({
            next: (v) => {
                this.commission.set(String(v.commissionPercent ?? 0));
                this.aiDescription.set(v.aiPrompts?.description ?? '');
                this.aiImage.set(v.aiPrompts?.image ?? '');
                this.aiVideo.set(v.aiPrompts?.video ?? '');
            },
            error: (err) => this.error.set(this.errMsg(err)),
        });
        this.api.get<MediaSettings>('media').subscribe({
            next: (v) => {
                this.maxImage.set(String(v.maxImageSizeMb ?? 0));
                this.maxVideo.set(String(v.maxVideoSizeMb ?? 0));
                this.maxImages.set(String(v.maxImagesPerProduct ?? 0));
            },
            error: (err) => this.error.set(this.errMsg(err)),
        });
        this.api.get<SeoSettings>('seo').subscribe({
            next: (v) => this.botUserAgents.set((v.botUserAgents ?? []).join('\n')),
            error: (err) => this.error.set(this.errMsg(err)),
        });
    }

    protected t(key: string): string {
        return this.i18n.t(key);
    }

    protected setText(target: { set(v: string): void }, event: Event): void {
        target.set((event.target as HTMLTextAreaElement).value);
    }

    protected saveDefault(): void {
        const value: DefaultSettings = {
            commissionPercent: this.num(this.commission()),
            aiPrompts: {
                description: this.aiDescription(),
                image: this.aiImage(),
                video: this.aiVideo(),
            },
        };
        this.save(this.api.put('default', value));
    }

    protected saveMedia(): void {
        const value: MediaSettings = {
            maxImageSizeMb: this.num(this.maxImage()),
            maxVideoSizeMb: this.num(this.maxVideo()),
            maxImagesPerProduct: this.num(this.maxImages()),
        };
        this.save(this.api.put('media', value));
    }

    protected saveSeo(): void {
        const value: SeoSettings = {
            botUserAgents: this.botUserAgents()
                .split('\n')
                .map((s) => s.trim())
                .filter((s) => s.length > 0),
        };
        this.save(this.api.put('seo', value));
    }

    private save(req: Observable<unknown>): void {
        this.saving.set(true);
        this.saved.set(false);
        this.error.set(null);
        req.subscribe({
            next: () => {
                this.saving.set(false);
                this.saved.set(true);
            },
            error: (err) => {
                this.saving.set(false);
                this.error.set(this.errMsg(err));
            },
        });
    }

    private num(value: string): number {
        const n = Number.parseFloat(value);
        return Number.isFinite(n) ? n : 0;
    }

    private errMsg(err: unknown): string {
        if (err && typeof err === 'object' && 'error' in err) {
            const body = (err as { error?: { message?: string } }).error;
            if (body?.message) {
                return body.message;
            }
        }
        return this.t('admin.common.error');
    }
}
