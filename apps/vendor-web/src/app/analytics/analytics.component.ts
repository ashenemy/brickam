import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { ButtonComponent, InputComponent } from '@brickam/ui-kit';
import { AnalyticsApiService, type AnalyticsDashboard } from './analytics-api.service';

/** Сегодня в формате YYYY-MM-DD. */
function today(): string {
    return new Date().toISOString().slice(0, 10);
}

/** Дата N дней назад в формате YYYY-MM-DD. */
function daysAgo(n: number): string {
    return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
}

/**
 * Дашборд аналитики: карточки (GMV/заказы/средний чек), div-бары выручки,
 * воронка статусов, топ-товары. Период (from/to) — date-инпуты.
 * Экспорт CSV/XLSX — ссылки в новой вкладке.
 */
@Component({
    selector: 'app-analytics',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonComponent, InputComponent],
    template: `
        <section class="flex flex-col gap-8">
            <h1 class="text-text-primary" style="font: var(--type-display)">
                {{ t('vendor.analytics.title') }}
            </h1>

            <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <bh-input
                    type="date"
                    [label]="t('vendor.analytics.from')"
                    [value]="from()"
                    (changed)="from.set($event)"
                />
                <bh-input
                    type="date"
                    [label]="t('vendor.analytics.to')"
                    [value]="to()"
                    (changed)="to.set($event)"
                />
                <bh-button variant="secondary" [disabled]="loading()" (clicked)="load()">
                    {{ t('vendor.analytics.refresh') }}
                </bh-button>
                <div class="flex flex-wrap gap-2">
                    <a [href]="csvHref()" target="_blank" rel="noopener">
                        <bh-button variant="ghost">{{ t('vendor.analytics.exportCsv') }}</bh-button>
                    </a>
                    <a [href]="xlsxHref()" target="_blank" rel="noopener">
                        <bh-button variant="ghost">{{ t('vendor.analytics.exportXlsx') }}</bh-button>
                    </a>
                </div>
            </div>

            @if (error()) {
                <p class="text-danger" role="alert">{{ error() }}</p>
            }

            @if (loading()) {
                <p class="text-text-secondary">{{ t('vendor.common.loading') }}</p>
            } @else if (data(); as d) {
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="rounded-md p-5 bg-surface-card" data-testid="card-gmv">
                        <p class="text-text-secondary">{{ t('vendor.analytics.gmv') }}</p>
                        <p class="text-text-primary" style="font: var(--type-display)">
                            {{ d.summary.gmv }} AMD
                        </p>
                    </div>
                    <div class="rounded-md p-5 bg-surface-card" data-testid="card-orders">
                        <p class="text-text-secondary">{{ t('vendor.analytics.orders') }}</p>
                        <p class="text-text-primary" style="font: var(--type-display)">
                            {{ d.summary.orders }}
                        </p>
                    </div>
                    <div class="rounded-md p-5 bg-surface-card" data-testid="card-avg">
                        <p class="text-text-secondary">{{ t('vendor.analytics.avgCheck') }}</p>
                        <p class="text-text-primary" style="font: var(--type-display)">
                            {{ round(d.summary.avgCheck) }} AMD
                        </p>
                    </div>
                </div>

                <div class="flex flex-col gap-3">
                    <h2 class="text-text-primary" style="font: var(--type-heading)">
                        {{ t('vendor.analytics.revenue') }}
                    </h2>
                    <div class="flex items-end gap-2 h-40">
                        @for (b of d.revenueSeries; track b.date) {
                            <div class="flex flex-1 flex-col items-center justify-end gap-1">
                                <div
                                    class="w-full rounded-sm bg-accent"
                                    [style.height.%]="barHeight(b.gmv)"
                                ></div>
                                <span class="text-text-tertiary" style="font: var(--type-caption)">
                                    {{ b.date.slice(5) }}
                                </span>
                            </div>
                        }
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div class="flex flex-col gap-2">
                        <h2 class="text-text-primary" style="font: var(--type-heading)">
                            {{ t('vendor.analytics.funnel') }}
                        </h2>
                        @for (f of d.statusFunnel; track f.status) {
                            <div class="flex justify-between text-text-primary">
                                <span>{{ f.status }}</span>
                                <span>{{ f.count }}</span>
                            </div>
                        }
                    </div>
                    <div class="flex flex-col gap-2">
                        <h2 class="text-text-primary" style="font: var(--type-heading)">
                            {{ t('vendor.analytics.topProducts') }}
                        </h2>
                        @for (p of d.topProducts; track p.productId) {
                            <div class="flex justify-between text-text-primary">
                                <span>{{ p.productId }}</span>
                                <span>{{ p.qty }} · {{ p.revenue }} AMD</span>
                            </div>
                        }
                    </div>
                </div>
            }
        </section>
    `,
})
export class AnalyticsComponent {
    private readonly api = inject(AnalyticsApiService);
    private readonly i18n = inject(LanguageService);

    protected readonly from = signal(daysAgo(30));
    protected readonly to = signal(today());
    protected readonly data = signal<AnalyticsDashboard | null>(null);
    protected readonly loading = signal(true);
    protected readonly error = signal<string | null>(null);

    protected readonly csvHref = computed(() => this.api.csvUrl(this.from(), this.to()));
    protected readonly xlsxHref = computed(() => this.api.xlsxUrl(this.from(), this.to()));

    private readonly maxGmv = computed(() => {
        const d = this.data();
        if (!d || d.revenueSeries.length === 0) {
            return 1;
        }
        return Math.max(1, ...d.revenueSeries.map((b) => b.gmv));
    });

    constructor() {
        this.load();
    }

    protected t(key: string): string {
        return this.i18n.t(key);
    }

    protected round(value: number): number {
        return Math.round(value);
    }

    protected barHeight(gmv: number): number {
        return Math.round((gmv / this.maxGmv()) * 100);
    }

    protected load(): void {
        this.loading.set(true);
        this.error.set(null);
        this.api.dashboard(this.from(), this.to()).subscribe({
            next: (d) => {
                this.data.set(d);
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
        return this.t('vendor.common.error');
    }
}
