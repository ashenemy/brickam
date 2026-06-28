import {
    ChangeDetectionStrategy,
    Component,
    effect,
    inject,
    type OnInit,
    signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { BadgeComponent, ButtonComponent } from '@brickam/ui-kit';
import type { PageMeta } from '../catalog/models';
import { CurrencyDisplayPipe } from '../currency/currency-display.pipe';
import type { Order } from './models';
import { orderStatusTone } from './order-status';
import { OrdersApiService } from './orders-api.service';

const PAGE_SIZE = 10;

/**
 * История заказов (route /orders, приватный). Пагинированный список со статус-
 * бейджем, суммой и датой; каждая строка ведёт на детальную страницу.
 */
@Component({
    selector: 'app-order-history',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [BadgeComponent, ButtonComponent, RouterLink, CurrencyDisplayPipe],
    template: `
        <section class="flex flex-col gap-6">
            <header class="flex flex-col gap-2">
                <h1 class="text-text-primary" style="font: var(--type-hero)">{{ ph('history') }}</h1>
            </header>

            @if (loading()) {
                <div class="py-16 text-center text-text-secondary" style="font: var(--type-product)">
                    {{ ph('loading') }}
                </div>
            } @else if (error()) {
                <div class="py-16 text-center text-danger" style="font: var(--type-product)">
                    {{ ph('error') }}
                </div>
            } @else if (orders().length === 0) {
                <div
                    class="py-16 text-center text-text-secondary"
                    style="font: var(--type-product)"
                    data-testid="orders-empty"
                >
                    {{ ph('empty') }}
                </div>
            } @else {
                <ul class="flex flex-col gap-3" data-testid="orders-list">
                    @for (order of orders(); track order.id) {
                        <li>
                            <a
                                [routerLink]="['/orders', order.id]"
                                class="flex flex-col gap-2 rounded-md bg-surface-card p-4 shadow-glass transition-shadow duration-base ease-soft hover:shadow-glass-hover sm:flex-row sm:items-center sm:justify-between focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                                data-testid="order-row"
                            >
                                <div class="flex flex-col gap-1">
                                    <span class="text-text-primary" style="font: var(--type-product)">
                                        {{ ph('number') }} {{ order.orderNumber }}
                                    </span>
                                    @if (order.createdAt) {
                                        <span
                                            class="text-text-tertiary"
                                            style="font: var(--type-caption)"
                                        >
                                            {{ formatDate(order.createdAt) }}
                                        </span>
                                    }
                                </div>
                                <div class="flex items-center gap-4">
                                    <bh-badge [tone]="tone(order)">{{ statusLabel(order) }}</bh-badge>
                                    <span class="text-price" style="font: var(--type-product)">
                                        {{ order.total | currencyDisplay }}
                                    </span>
                                </div>
                            </a>
                        </li>
                    }
                </ul>

                <nav class="flex items-center justify-center gap-4 pt-2" aria-label="Pagination">
                    <bh-button
                        variant="secondary"
                        [disabled]="!meta()?.hasPrev"
                        (clicked)="prev()"
                    >
                        {{ ph('prev') }}
                    </bh-button>
                    <span class="text-text-secondary" style="font: var(--type-caption)">
                        {{ page() }} / {{ meta()?.totalPages ?? 1 }}
                    </span>
                    <bh-button
                        variant="secondary"
                        [disabled]="!meta()?.hasNext"
                        (clicked)="next()"
                    >
                        {{ ph('next') }}
                    </bh-button>
                </nav>
            }
        </section>
    `,
})
export class OrderHistoryComponent implements OnInit {
    private readonly api = inject(OrdersApiService);
    private readonly i18n = inject(LanguageService);
    private readonly title = inject(Title);

    protected readonly orders = signal<Order[]>([]);
    protected readonly meta = signal<PageMeta | undefined>(undefined);
    protected readonly page = signal(1);
    protected readonly loading = signal(true);
    protected readonly error = signal(false);

    constructor() {
        effect(() => this.title.setTitle(this.ph('history')));
    }

    ngOnInit(): void {
        this.fetch();
    }

    private fetch(): void {
        this.loading.set(true);
        this.error.set(false);
        this.api.list(this.page(), PAGE_SIZE).subscribe({
            next: (res) => {
                this.orders.set(res.data);
                this.meta.set(res.meta);
                this.loading.set(false);
            },
            error: () => {
                this.orders.set([]);
                this.meta.set(undefined);
                this.error.set(true);
                this.loading.set(false);
            },
        });
    }

    protected prev(): void {
        if (this.meta()?.hasPrev) {
            this.page.update((p) => Math.max(1, p - 1));
            this.fetch();
        }
    }

    protected next(): void {
        if (this.meta()?.hasNext) {
            this.page.update((p) => p + 1);
            this.fetch();
        }
    }

    protected tone(order: Order) {
        return orderStatusTone(order.status);
    }

    protected statusLabel(order: Order): string {
        return this.ph(`status.${order.status}`);
    }

    protected formatDate(iso: string): string {
        const d = new Date(iso);
        return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('ru-RU');
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

const DEFAULTS: Record<string, string> = {
    history: 'My orders',
    loading: 'Loading…',
    error: 'Failed to load orders',
    empty: 'You have no orders yet',
    number: 'Order',
    prev: 'Previous',
    next: 'Next',
    'status.created': 'Created',
    'status.paid': 'Paid',
    'status.processing': 'Processing',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',
};
