import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { BadgeComponent } from '@brickam/ui-kit';
import { CurrencyDisplayPipe } from '../currency/currency-display.pipe';
import type { Order } from './models';
import { DELIVERY_STEPS, orderStatusTone } from './order-status';
import { OrdersApiService } from './orders-api.service';

/**
 * Детальная страница заказа (route /orders/:id, приватный). Показывает номер,
 * статус, итоги, адрес доставки и трекинг доставки в виде шагов.
 */
@Component({
    selector: 'app-order-detail',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [BadgeComponent, RouterLink, CurrencyDisplayPipe],
    template: `
        <section class="flex flex-col gap-6">
            @if (loading()) {
                <div class="py-16 text-center text-text-secondary" style="font: var(--type-product)">
                    {{ ph('loading') }}
                </div>
            } @else if (error() || !order()) {
                <div class="py-16 text-center text-danger" style="font: var(--type-product)">
                    {{ ph('notFound') }}
                </div>
            } @else {
                <header class="flex flex-col gap-3">
                    <a
                        routerLink="/orders"
                        class="text-accent cursor-pointer rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                        style="font: var(--type-caption)"
                    >
                        ← {{ ph('back') }}
                    </a>
                    <div class="flex flex-wrap items-center gap-3">
                        <h1 class="text-text-primary" style="font: var(--type-hero)">
                            {{ ph('number') }} {{ order()!.orderNumber }}
                        </h1>
                        <bh-badge [tone]="tone()" data-testid="order-status">
                            {{ statusLabel() }}
                        </bh-badge>
                    </div>
                </header>

                <!-- Трекинг доставки -->
                <div class="flex flex-col gap-3 rounded-xl bg-surface-card p-5" data-testid="order-track">
                    <h2 class="text-text-primary" style="font: var(--type-section)">
                        {{ ph('track') }}
                    </h2>
                    <ol class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
                        @for (step of steps(); track step.status) {
                            <li class="flex items-center gap-2">
                                <span
                                    class="inline-flex h-7 w-7 items-center justify-center rounded-full text-12 font-semibold"
                                    [class.bg-accent]="step.done"
                                    [class.text-text-on-accent]="step.done"
                                    [class.bg-surface-chip]="!step.done"
                                    [class.text-text-tertiary]="!step.done"
                                >
                                    {{ step.index }}
                                </span>
                                <span
                                    [class]="step.done ? 'text-text-primary' : 'text-text-tertiary'"
                                    style="font: var(--type-caption)"
                                >
                                    {{ stepLabel(step.status) }}
                                </span>
                            </li>
                        }
                    </ol>
                </div>

                <!-- Итоги -->
                <div class="flex flex-col gap-2 rounded-xl bg-surface-card p-5">
                    <div class="flex justify-between text-text-secondary" style="font: var(--type-product)">
                        <span>{{ ph('subtotal') }}</span>
                        <span>{{ order()!.subtotal | currencyDisplay }}</span>
                    </div>
                    @if (order()!.productDiscountTotal > 0) {
                        <div class="flex justify-between text-success" style="font: var(--type-product)">
                            <span>{{ ph('productDiscount') }}</span>
                            <span>−{{ order()!.productDiscountTotal | currencyDisplay }}</span>
                        </div>
                    }
                    @if (order()!.loyaltyDiscount > 0) {
                        <div class="flex justify-between text-success" style="font: var(--type-product)">
                            <span>{{ ph('loyaltyDiscount') }}</span>
                            <span>−{{ order()!.loyaltyDiscount | currencyDisplay }}</span>
                        </div>
                    }
                    <div
                        class="mt-2 flex justify-between border-t border-[var(--border-subtle)] pt-3 text-text-primary"
                        style="font: var(--type-price)"
                    >
                        <span>{{ ph('total') }}</span>
                        <span data-testid="order-total">{{ order()!.total | currencyDisplay }}</span>
                    </div>
                </div>

                <!-- Адрес доставки -->
                <div class="flex flex-col gap-2 rounded-xl bg-surface-card p-5" data-testid="order-address">
                    <h2 class="text-text-primary" style="font: var(--type-section)">
                        {{ ph('address') }}
                    </h2>
                    @if (order()!.deliveryAddressSnapshot; as a) {
                        <p class="text-text-secondary" style="font: var(--type-product)">
                            {{ a.label }}
                        </p>
                        <p class="text-text-secondary" style="font: var(--type-product)">
                            {{ a.region }}, {{ a.city }}, {{ a.line1 }}@if (a.line2) {, {{ a.line2 }}}
                        </p>
                        <p class="text-text-secondary" style="font: var(--type-product)">
                            {{ a.phone }}
                        </p>
                    }
                </div>
            }
        </section>
    `,
})
export class OrderDetailComponent {
    private readonly api = inject(OrdersApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly i18n = inject(LanguageService);
    private readonly title = inject(Title);

    protected readonly order = signal<Order | undefined>(undefined);
    protected readonly loading = signal(true);
    protected readonly error = signal(false);

    constructor() {
        this.route.paramMap.subscribe((params) => {
            const id = params.get('id');
            if (id) {
                this.load(id);
            }
        });

        effect(() => {
            const o = this.order();
            this.title.setTitle(o ? `${this.ph('number')} ${o.orderNumber}` : this.ph('history'));
        });
    }

    private load(id: string): void {
        this.loading.set(true);
        this.error.set(false);
        this.api.getById(id).subscribe({
            next: (o) => {
                this.order.set(o);
                this.loading.set(false);
            },
            error: () => {
                this.order.set(undefined);
                this.error.set(true);
                this.loading.set(false);
            },
        });
    }

    protected tone() {
        const o = this.order();
        return o ? orderStatusTone(o.status) : 'neutral';
    }

    protected statusLabel(): string {
        const o = this.order();
        return o ? this.ph(`status.${o.status}`) : '';
    }

    /** Шаги доставки с отметкой пройденности по статусу заказа. */
    protected readonly steps = computed(() => {
        const o = this.order();
        // Прогресс по статусу заказа: paid+ → принят; completed → доставлен.
        const reached = o ? orderProgress(o.status) : -1;
        return DELIVERY_STEPS.map((status, i) => ({
            status,
            index: i + 1,
            done: i <= reached,
        }));
    });

    protected stepLabel(status: string): string {
        return this.ph(`delivery.${status}`);
    }

    protected ph(key: string): string {
        const full = `order.${key}`;
        const translated = this.i18n.t(full);
        if (translated !== full) {
            return translated;
        }
        return DEFAULTS[key] ?? key;
    }
}

/** Маппинг статуса заказа в индекс пройденного шага доставки. */
function orderProgress(status: Order['status']): number {
    switch (status) {
        case 'completed':
            return 3; // delivered
        case 'processing':
            return 2; // in_transit
        case 'paid':
            return 0; // accepted
        default:
            return -1;
    }
}

const DEFAULTS: Record<string, string> = {
    history: 'My orders',
    loading: 'Loading…',
    notFound: 'Order not found',
    back: 'Back to orders',
    number: 'Order',
    track: 'Delivery tracking',
    subtotal: 'Subtotal',
    productDiscount: 'Product discount',
    loyaltyDiscount: 'Loyalty discount',
    total: 'Total',
    address: 'Delivery address',
    'status.created': 'Created',
    'status.paid': 'Paid',
    'status.processing': 'Processing',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',
    'delivery.accepted': 'Accepted',
    'delivery.picked': 'Picked',
    'delivery.in_transit': 'In transit',
    'delivery.delivered': 'Delivered',
};
