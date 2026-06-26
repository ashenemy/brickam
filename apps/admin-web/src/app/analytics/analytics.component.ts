import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { ButtonComponent, InputComponent } from '@brickam/ui-kit';
import { AnalyticsApiService, type PlatformAnalytics } from './analytics-api.service';

/** Пустая сводка до первой успешной загрузки. */
const EMPTY: PlatformAnalytics = { gmv: 0, platformRevenue: 0, orders: 0 };

/**
 * Платформенная аналитика: карточки GMV / выручка платформы / заказы за период.
 * Данные грузятся из GET /admin/analytics; при ошибке показываем сообщение.
 */
@Component({
    selector: 'app-analytics',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonComponent, InputComponent],
    template: `
        <section class="flex flex-col gap-8">
            <h1 class="text-text-primary" style="font: var(--type-display)">
                {{ t('admin.analytics.title') }}
            </h1>

            <div class="flex flex-wrap items-end gap-4">
                <bh-input
                    type="date"
                    [label]="t('admin.analytics.from')"
                    [value]="from()"
                    (changed)="from.set($event)"
                />
                <bh-input
                    type="date"
                    [label]="t('admin.analytics.to')"
                    [value]="to()"
                    (changed)="to.set($event)"
                />
                <bh-button variant="primary" [disabled]="loading()" (clicked)="reload()">
                    {{ loading() ? t('admin.common.loading') : t('admin.analytics.refresh') }}
                </bh-button>
            </div>

            @if (error()) {
                <p class="text-danger" role="alert" style="font: var(--type-caption)">
                    {{ error() }}
                </p>
            }

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="flex flex-col gap-2 rounded-md p-5 bg-surface-card">
                    <span class="text-text-secondary" style="font: var(--type-product)">
                        {{ t('admin.analytics.gmv') }}
                    </span>
                    <span class="text-text-primary" style="font: var(--type-heading)">
                        {{ summary().gmv }} AMD
                    </span>
                </div>
                <div class="flex flex-col gap-2 rounded-md p-5 bg-surface-card">
                    <span class="text-text-secondary" style="font: var(--type-product)">
                        {{ t('admin.analytics.revenue') }}
                    </span>
                    <span class="text-text-primary" style="font: var(--type-heading)">
                        {{ summary().platformRevenue }} AMD
                    </span>
                </div>
                <div class="flex flex-col gap-2 rounded-md p-5 bg-surface-card">
                    <span class="text-text-secondary" style="font: var(--type-product)">
                        {{ t('admin.analytics.orders') }}
                    </span>
                    <span class="text-text-primary" style="font: var(--type-heading)">
                        {{ summary().orders }}
                    </span>
                </div>
            </div>
        </section>
    `,
})
export class AnalyticsComponent {
    private readonly api = inject(AnalyticsApiService);
    private readonly i18n = inject(LanguageService);

    protected readonly from = signal('');
    protected readonly to = signal('');
    protected readonly summary = signal<PlatformAnalytics>(EMPTY);
    protected readonly loading = signal(false);
    protected readonly error = signal<string | null>(null);

    constructor() {
        this.reload();
    }

    protected t(key: string): string {
        return this.i18n.t(key);
    }

    protected reload(): void {
        this.loading.set(true);
        this.error.set(null);
        this.api.summary(this.from(), this.to()).subscribe({
            next: (data) => {
                this.summary.set(data);
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(this.errMsg(err));
                this.loading.set(false);
            },
        });
    }

    /** Сообщение об ошибке из тела ответа или общий текст. */
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
