import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    type OnInit,
    signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { ButtonComponent } from '@brickam/ui-kit';
import { CatalogApiService } from '../catalog/catalog-api.service';
import type { ProductListItem } from '../catalog/models';
import { CurrencyDisplayPipe } from '../currency/currency-display.pipe';
import { CartStore } from './cart.store';
import type { CartItem } from './models';

/**
 * Страница корзины (route /cart). Список позиций с +/−/удалением, итоги
 * (subtotal/скидки/total) и переход к оформлению. Названия берутся из
 * titleSnapshot, иначе подтягиваются из каталога по productId.
 */
@Component({
    selector: 'app-cart-page',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonComponent, RouterLink, CurrencyDisplayPipe],
    template: `
        <section class="flex flex-col gap-6">
            <header class="flex flex-col gap-2">
                <h1 class="text-text-primary" style="font: var(--type-hero)">{{ ph('title') }}</h1>
            </header>

            @if (store.isEmpty()) {
                <div
                    class="flex flex-col items-center gap-4 py-16 text-center"
                    data-testid="cart-empty"
                >
                    <p class="text-text-secondary" style="font: var(--type-product)">
                        {{ ph('empty') }}
                    </p>
                    <a routerLink="/catalog">
                        <bh-button variant="primary">{{ ph('goCatalog') }}</bh-button>
                    </a>
                </div>
            } @else {
                <ul class="flex flex-col gap-4" data-testid="cart-list">
                    @for (item of rows(); track item.productId) {
                        <li
                            class="flex flex-col gap-3 rounded-xl bg-surface-card p-4 sm:flex-row sm:items-center sm:justify-between"
                            data-testid="cart-row"
                        >
                            <div class="flex min-w-0 flex-col gap-1">
                                <span
                                    class="truncate text-text-primary"
                                    style="font: var(--type-product)"
                                >
                                    {{ item.title }}
                                </span>
                                <span class="text-price" style="font: var(--type-caption)">
                                    {{ item.unitPrice | currencyDisplay }}
                                </span>
                            </div>

                            <div class="flex items-center gap-4">
                                <div
                                    class="inline-flex items-center rounded-md bg-[var(--glass-fill)] shadow-[inset_0_0_0_1px_var(--border-default)]"
                                >
                                    <button
                                        type="button"
                                        class="inline-flex h-10 w-10 items-center justify-center border-0 bg-transparent text-20 text-text-primary cursor-pointer rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                                        [attr.aria-label]="ph('decrease')"
                                        data-testid="cart-dec"
                                        (click)="dec(item.productId)"
                                    >
                                        −
                                    </button>
                                    <span
                                        class="min-w-[32px] text-center text-text-primary text-16"
                                        data-testid="cart-qty"
                                    >
                                        {{ item.qty }}
                                    </span>
                                    <button
                                        type="button"
                                        class="inline-flex h-10 w-10 items-center justify-center border-0 bg-transparent text-20 text-text-primary cursor-pointer rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                                        [attr.aria-label]="ph('increase')"
                                        data-testid="cart-inc"
                                        (click)="inc(item.productId)"
                                    >
                                        +
                                    </button>
                                </div>

                                <span
                                    class="w-28 text-right text-text-primary"
                                    style="font: var(--type-product)"
                                    data-testid="cart-line-total"
                                >
                                    {{ item.lineTotal | currencyDisplay }}
                                </span>

                                <button
                                    type="button"
                                    class="text-danger cursor-pointer border-0 bg-transparent rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                                    style="font: var(--type-caption)"
                                    [attr.aria-label]="ph('remove')"
                                    data-testid="cart-remove"
                                    (click)="remove(item.productId)"
                                >
                                    {{ ph('remove') }}
                                </button>
                            </div>
                        </li>
                    }
                </ul>

                <!-- Итоги -->
                <div
                    class="ml-auto flex w-full max-w-sm flex-col gap-2 rounded-xl bg-surface-card p-5"
                    data-testid="cart-summary"
                >
                    <div class="flex justify-between text-text-secondary" style="font: var(--type-product)">
                        <span>{{ ph('subtotal') }}</span>
                        <span>{{ store.subtotal() | currencyDisplay }}</span>
                    </div>
                    @if (store.discountTotal() > 0) {
                        <div class="flex justify-between text-success" style="font: var(--type-product)">
                            <span>{{ ph('discount') }}</span>
                            <span>−{{ store.discountTotal() | currencyDisplay }}</span>
                        </div>
                    }
                    <div
                        class="mt-2 flex justify-between border-t border-[var(--border-subtle)] pt-3 text-text-primary"
                        style="font: var(--type-price)"
                    >
                        <span>{{ ph('total') }}</span>
                        <span data-testid="cart-total">{{ store.total() | currencyDisplay }}</span>
                    </div>
                    <bh-button
                        variant="primary"
                        size="lg"
                        [block]="true"
                        data-testid="cart-checkout"
                        (clicked)="checkout()"
                    >
                        {{ ph('checkout') }}
                    </bh-button>
                    <button
                        type="button"
                        class="text-text-tertiary cursor-pointer border-0 bg-transparent rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                        style="font: var(--type-caption)"
                        data-testid="cart-clear"
                        (click)="clear()"
                    >
                        {{ ph('clear') }}
                    </button>
                </div>
            }
        </section>
    `,
})
export class CartPageComponent implements OnInit {
    protected readonly store = inject(CartStore);
    private readonly catalogApi = inject(CatalogApiService);
    private readonly router = inject(Router);
    private readonly i18n = inject(LanguageService);
    private readonly title = inject(Title);

    protected readonly lang = this.i18n.lang;

    // Кэш карточек каталога для названий, когда нет titleSnapshot.
    private readonly products = signal<Map<string, ProductListItem>>(new Map());

    constructor() {
        // Подтягиваем недостающие названия из каталога по productId.
        effect(() => {
            const missing = this.store
                .items()
                .filter((i) => !i.titleSnapshot && !this.products().has(i.productId))
                .map((i) => i.productId);
            if (missing.length) {
                this.catalogApi.getProductsByIds(missing).subscribe({
                    next: (list) =>
                        this.products.update((prev) => {
                            const next = new Map(prev);
                            for (const p of list) {
                                next.set(p.id, p);
                            }
                            return next;
                        }),
                    error: () => undefined,
                });
            }
        });

        effect(() => this.title.setTitle(this.ph('title')));
    }

    ngOnInit(): void {
        this.store.load();
    }

    /** Строки для отображения: название + цены с учётом скидки-снимка. */
    protected readonly rows = computed(() =>
        this.store.items().map((item) => ({
            productId: item.productId,
            qty: item.qty,
            title: this.titleOf(item),
            unitPrice: item.priceSnapshot,
            lineTotal: item.priceSnapshot * item.qty,
        })),
    );

    private titleOf(item: CartItem): string {
        if (item.titleSnapshot) {
            return item.titleSnapshot[this.lang()];
        }
        const p = this.products().get(item.productId);
        return p ? p.title[this.lang()] : item.productId;
    }

    protected inc(productId: string): void {
        this.store.increment(productId);
    }

    protected dec(productId: string): void {
        this.store.decrement(productId);
    }

    protected remove(productId: string): void {
        this.store.removeItem(productId);
    }

    protected clear(): void {
        this.store.clear();
    }

    protected checkout(): void {
        void this.router.navigate(['/checkout']);
    }

    protected ph(key: string): string {
        const full = `cart.${key}`;
        const translated = this.i18n.t(full);
        if (translated !== full) {
            return translated;
        }
        return DEFAULTS[key] ?? key;
    }
}

const DEFAULTS: Record<string, string> = {
    title: 'Cart',
    empty: 'Your cart is empty',
    goCatalog: 'Go to catalog',
    subtotal: 'Subtotal',
    discount: 'Discount',
    total: 'Total',
    checkout: 'Checkout',
    clear: 'Clear cart',
    remove: 'Remove',
    increase: 'Increase quantity',
    decrease: 'Decrease quantity',
};
