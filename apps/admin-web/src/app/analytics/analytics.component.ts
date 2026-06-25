import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { ButtonComponent, InputComponent } from '@brickam/ui-kit';
import { AnalyticsApiService, type PlatformAnalytics } from './analytics-api.service';

/** Мок-сводка для случая, когда бэкенд-контроллера ещё нет. */
const MOCK: PlatformAnalytics = { gmv: 12_500_000, platformRevenue: 625_000, orders: 842 };

/**
 * Платформенная аналитика: карточки GMV / выручка платформы / заказы за период.
 * TODO: при отсутствии контроллера GET /admin/analytics показываем моки.
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

            @if (mocked()) {
                <p class="text-text-tertiary" style="font: var(--type-caption)">
                    {{ t('admin.analytics.mockNote') }}
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
    protected readonly summary = signal<PlatformAnalytics>(MOCK);
    protected readonly loading = signal(false);
    protected readonly mocked = signal(false);

    constructor() {
        this.reload();
    }

    protected t(key: string): string {
        return this.i18n.t(key);
    }

    protected reload(): void {
        this.loading.set(true);
        this.api.summary(this.from(), this.to()).subscribe({
            next: (data) => {
                this.summary.set(data);
                this.mocked.set(false);
                this.loading.set(false);
            },
            error: () => {
                // TODO: бэкенд может не иметь контроллера — fallback на моки.
                this.summary.set(MOCK);
                this.mocked.set(true);
                this.loading.set(false);
            },
        });
    }
}
