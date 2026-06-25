import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    type OnInit,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { BadgeComponent } from '@brickam/ui-kit';
import { LoyaltyStore } from './loyalty.store';
import type { LoyaltyTier } from './models';

/**
 * Страница лояльности (route /loyalty). Показывает карточку статуса
 * (текущий уровень, метрика по basis программы, активная скидка, прогресс
 * до следующего уровня) и список всех уровней с подсветкой текущего.
 */
@Component({
    selector: 'app-loyalty',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [BadgeComponent],
    template: `
        <section class="flex flex-col gap-8">
            <header class="flex flex-col gap-2">
                <h1 class="text-text-primary" style="font: var(--type-hero)">{{ ph('title') }}</h1>
            </header>

            @if (status(); as s) {
                <article
                    class="flex flex-col gap-6 rounded-lg bg-bg-surface p-6 shadow-sm"
                    data-testid="loyalty-card"
                >
                    <div class="flex flex-wrap items-center gap-3">
                        <span class="text-text-secondary" style="font: var(--type-label)">
                            {{ ph('currentLevel') }}
                        </span>
                        @if (s.currentTier; as tier) {
                            <bh-badge tone="accent" data-testid="loyalty-current-tier">
                                {{ tier.name }}
                            </bh-badge>
                        } @else {
                            <span class="text-text-secondary" style="font: var(--type-product)">—</span>
                        }
                    </div>

                    <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div class="flex flex-col gap-1">
                            <dt class="text-text-secondary" style="font: var(--type-label)">
                                {{ metricLabel() }}
                            </dt>
                            <dd
                                class="text-text-primary"
                                style="font: var(--type-product)"
                                data-testid="loyalty-metric"
                            >
                                {{ metricValue() }}
                            </dd>
                        </div>

                        @if (s.currentTier) {
                            <div class="flex flex-col gap-1">
                                <dt class="text-text-secondary" style="font: var(--type-label)">
                                    {{ ph('discount') }}
                                </dt>
                                <dd
                                    class="text-text-primary"
                                    style="font: var(--type-product)"
                                    data-testid="loyalty-discount"
                                >
                                    {{ discountLabel() }}
                                </dd>
                            </div>
                        }
                    </dl>

                    @if (s.nextTier; as next) {
                        <div class="flex flex-col gap-2">
                            <div class="flex items-center justify-between">
                                <span class="text-text-secondary" style="font: var(--type-label)">
                                    {{ ph('nextLevel') }}: {{ next.name }}
                                </span>
                                <span
                                    class="text-text-secondary"
                                    style="font: var(--type-label)"
                                    data-testid="loyalty-to-next"
                                >
                                    {{ ph('toNext') }}: {{ toNextLabel() }}
                                </span>
                            </div>
                            <div
                                class="h-2 w-full overflow-hidden rounded-pill bg-bg-app"
                                role="progressbar"
                                [attr.aria-valuenow]="progressPercent()"
                                aria-valuemin="0"
                                aria-valuemax="100"
                                data-testid="loyalty-progress"
                            >
                                <div
                                    class="h-full rounded-pill bg-accent transition-all duration-base"
                                    [style.width.%]="progressPercent()"
                                    data-testid="loyalty-progress-fill"
                                ></div>
                            </div>
                        </div>
                    }
                </article>
            } @else {
                <div
                    class="py-16 text-center text-text-secondary"
                    style="font: var(--type-product)"
                    data-testid="loyalty-empty"
                >
                    {{ ph('empty') }}
                </div>
            }

            @if (tiers().length > 0) {
                <section class="flex flex-col gap-3">
                    <h2 class="text-text-primary" style="font: var(--type-section)">
                        {{ ph('allLevels') }}
                    </h2>
                    <ul class="flex flex-col gap-2" data-testid="loyalty-tiers">
                        @for (tier of tiers(); track tier.level) {
                            <li
                                class="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4"
                                [class.border-accent]="isCurrent(tier)"
                                [class.bg-bg-surface]="isCurrent(tier)"
                                [class.border-transparent]="!isCurrent(tier)"
                                [class.bg-bg-app]="!isCurrent(tier)"
                                [attr.data-current]="isCurrent(tier) ? 'true' : null"
                            >
                                <div class="flex items-center gap-3">
                                    <span class="text-text-primary" style="font: var(--type-product)">
                                        {{ tier.name }}
                                    </span>
                                    @if (isCurrent(tier)) {
                                        <bh-badge tone="success">{{ ph('level') }}</bh-badge>
                                    }
                                </div>
                                <span class="text-text-secondary" style="font: var(--type-label)">
                                    {{ tierThresholdLabel(tier) }} · {{ tierDiscountLabel(tier) }}
                                </span>
                            </li>
                        }
                    </ul>
                </section>
            } @else {
                <p class="text-text-secondary" style="font: var(--type-label)">
                    {{ ph('noProgram') }}
                </p>
            }
        </section>
    `,
})
export class LoyaltyPageComponent implements OnInit {
    private readonly store = inject(LoyaltyStore);
    private readonly i18n = inject(LanguageService);
    private readonly title = inject(Title);

    protected readonly status = this.store.status;
    protected readonly discountLabel = this.store.discountLabel;
    protected readonly progressPercent = this.store.progressPercent;
    protected readonly tiers = computed(() => this.store.program()?.tiers ?? []);

    constructor() {
        effect(() => {
            this.title.setTitle(this.ph('title'));
        });
    }

    ngOnInit(): void {
        this.store.load();
    }

    /** По basis программы: order_count → orders, иначе → spend. */
    protected readonly metricLabel = computed(() =>
        this.store.program()?.basis === 'order_count' ? this.ph('orders') : this.ph('spend'),
    );

    protected readonly metricValue = computed(() => {
        const metric = this.status()?.metric;
        if (!metric) {
            return '—';
        }
        if (this.store.program()?.basis === 'order_count') {
            return String(metric.totalOrders);
        }
        return this.amd(metric.totalSpend);
    });

    protected toNextLabel(): string {
        const s = this.status();
        const toNext = s?.toNext ?? 0;
        return this.store.program()?.basis === 'order_count' ? String(toNext) : this.amd(toNext);
    }

    protected isCurrent(tier: LoyaltyTier): boolean {
        return this.status()?.currentTier?.level === tier.level;
    }

    protected tierThresholdLabel(tier: LoyaltyTier): string {
        return this.store.program()?.basis === 'order_count'
            ? String(tier.threshold)
            : this.amd(tier.threshold);
    }

    protected tierDiscountLabel(tier: LoyaltyTier): string {
        return tier.discountType === 'percent'
            ? `${tier.discountValue}%`
            : this.amd(tier.discountValue);
    }

    /** Сумма в AMD (драмы). */
    private amd(value: number): string {
        return `${value.toLocaleString('ru-RU')} ֏`;
    }

    protected ph(key: string): string {
        const full = `loyalty.${key}`;
        const translated = this.i18n.t(full);
        if (translated !== full) {
            return translated;
        }
        return DEFAULTS[key] ?? key;
    }
}

const DEFAULTS: Record<string, string> = {
    title: 'Loyalty',
    level: 'Current',
    currentLevel: 'Current level',
    spend: 'Total spend',
    orders: 'Total orders',
    discount: 'Discount',
    nextLevel: 'Next level',
    toNext: 'Left to next',
    allLevels: 'All levels',
    empty: 'Sign in to see your loyalty status',
    noProgram: 'Loyalty program is not available',
};
