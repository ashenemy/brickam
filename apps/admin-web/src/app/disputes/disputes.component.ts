import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { BadgeComponent, ButtonComponent } from '@brickam/ui-kit';
import { type Dispute, DisputesApiService } from './disputes-api.service';

const TEXTAREA_CLASS =
    'min-w-0 rounded-md border-0 px-5 py-4 bg-[rgb(var(--color-neutral-900)/0.9)] text-text-primary font-input text-18 outline-none shadow-[inset_0_0_0_1px_var(--border-subtle),var(--shadow-inset)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]';

/**
 * Споры: список + действия. «В рассмотрение» → PATCH /review,
 * «Разрешить» с текстом resolution → PATCH /resolve.
 */
@Component({
    selector: 'app-disputes',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonComponent, BadgeComponent],
    template: `
        <section class="flex flex-col gap-8">
            <h1 class="text-text-primary" style="font: var(--type-display)">
                {{ t('admin.disputes.title') }}
            </h1>

            @if (error()) {
                <p class="text-danger" role="alert">{{ error() }}</p>
            }

            @if (loading()) {
                <p class="text-text-secondary">{{ t('admin.common.loading') }}</p>
            } @else if (disputes().length === 0) {
                <p class="text-text-secondary">{{ t('admin.common.empty') }}</p>
            } @else {
                <div class="flex flex-col gap-4">
                    @for (d of disputes(); track d.id) {
                        <div class="flex flex-col gap-3 rounded-md p-5 bg-surface-card">
                            <div class="flex flex-wrap items-center justify-between gap-3">
                                <span class="text-text-primary" style="font: var(--type-heading)">
                                    {{ t('admin.disputes.col.order') }}: {{ d.orderId || d.id }}
                                </span>
                                <bh-badge tone="accent">{{ d.status }}</bh-badge>
                            </div>
                            @if (d.reason) {
                                <p class="text-text-secondary">{{ d.reason }}</p>
                            }
                            <textarea
                                rows="2"
                                [value]="resolutionOf(d.id)"
                                (input)="setResolution(d.id, $event)"
                                [placeholder]="t('admin.disputes.resolutionPlaceholder')"
                                [class]="taClass"
                            ></textarea>
                            <div class="flex flex-wrap gap-2">
                                <bh-button
                                    size="sm"
                                    variant="secondary"
                                    (clicked)="review(d)"
                                >
                                    {{ t('admin.disputes.review') }}
                                </bh-button>
                                <bh-button
                                    size="sm"
                                    variant="primary"
                                    [disabled]="!resolutionOf(d.id).trim()"
                                    (clicked)="resolve(d)"
                                >
                                    {{ t('admin.disputes.resolve') }}
                                </bh-button>
                            </div>
                        </div>
                    }
                </div>
            }
        </section>
    `,
})
export class DisputesComponent {
    private readonly api = inject(DisputesApiService);
    private readonly i18n = inject(LanguageService);

    protected readonly taClass = TEXTAREA_CLASS;
    protected readonly disputes = signal<Dispute[]>([]);
    protected readonly loading = signal(true);
    protected readonly error = signal<string | null>(null);
    private readonly resolutions = signal<Record<string, string>>({});

    constructor() {
        this.reload();
    }

    protected t(key: string): string {
        return this.i18n.t(key);
    }

    protected resolutionOf(id: string): string {
        return this.resolutions()[id] ?? '';
    }

    protected setResolution(id: string, event: Event): void {
        const value = (event.target as HTMLTextAreaElement).value;
        this.resolutions.update((m) => ({ ...m, [id]: value }));
    }

    protected review(d: Dispute): void {
        this.api.review(d.id).subscribe({
            next: (updated) => this.patch(updated),
            error: (err) => this.error.set(this.errMsg(err)),
        });
    }

    protected resolve(d: Dispute): void {
        const resolution = this.resolutionOf(d.id).trim();
        if (!resolution) {
            return;
        }
        this.api.resolve(d.id, resolution).subscribe({
            next: (updated) => this.patch(updated),
            error: (err) => this.error.set(this.errMsg(err)),
        });
    }

    private patch(updated: Dispute): void {
        this.disputes.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
    }

    private reload(): void {
        this.loading.set(true);
        this.api.list().subscribe({
            next: (items) => {
                this.disputes.set(items);
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(this.errMsg(err));
                this.loading.set(false);
            },
        });
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
