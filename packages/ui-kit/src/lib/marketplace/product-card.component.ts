import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { BadgeComponent } from '../core/badge.component';
import { RatingComponent } from '../core/rating.component';

export interface Product {
    id: string | number;
    title: string;
    vendor: string;
    price: string;
    oldPrice?: string;
    unit: string;
    rating?: number;
    image?: string;
    badge?: string;
}

/**
 * ProductCard — фирменная стеклянная карточка товара на официальном `mat-card`.
 * Сверху панель с фото, снизу инфо-панель: название (до 3 строк) + поставщик
 * растягиваются, рейтинг и цена прижаты к низу. Бейдж/рейтинг — core на Material.
 * Карточка тянется на всю высоту ячейки — одинаковая высота карточек в ряду.
 */
@Component({
    selector: 'bh-product-card',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatCard, MatIcon, BadgeComponent, RatingComponent],
    template: `
        <mat-card
            appearance="outlined"
            class="bh-product-card group flex h-full w-full cursor-pointer flex-col rounded-md bg-[var(--glass-fill)] p-1 backdrop-blur-glass shadow-glass"
            (click)="cardClick.emit(product())"
        >
            <!-- Image panel -->
            <div
                class="relative aspect-square shrink-0 cursor-zoom-in overflow-hidden bg-white"
                style="border-radius: var(--radius-md) var(--radius-md) 0 0"
                (click)="onGallery($event)"
            >
                @if (product().image) {
                    <img [src]="product().image" [alt]="product().title" class="h-full w-full object-cover" />
                } @else {
                    <div
                        class="flex h-full w-full items-center justify-center bg-surface-card-alt text-text-tertiary"
                        style="font: var(--type-caption)"
                        aria-hidden="true"
                    >
                        No image
                    </div>
                }
                @if (product().badge) {
                    <span class="absolute left-3 top-3 z-30">
                        <bh-badge tone="accent">{{ product().badge }}</bh-badge>
                    </span>
                }

                <!-- Ховер-оверлей: блюр + действия (галерея / открыть / в корзину / вишлист) -->
                <div
                    class="pointer-events-none absolute inset-0 z-20 flex flex-wrap content-center items-center justify-center gap-2 bg-black/35 p-3 opacity-0 backdrop-blur-sm transition-opacity duration-slow ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
                >
                    <button type="button" class="bh-ov-btn" aria-label="Gallery" (click)="onGallery($event)">
                        <mat-icon>collections</mat-icon>
                    </button>
                    <button type="button" class="bh-ov-btn" aria-label="Open product" (click)="onView($event)">
                        <mat-icon>visibility</mat-icon>
                    </button>
                    <button type="button" class="bh-ov-btn" aria-label="Add to cart" (click)="onDetails($event)">
                        <mat-icon>shopping_cart</mat-icon>
                    </button>
                    <button
                        type="button"
                        class="bh-ov-btn"
                        [attr.aria-pressed]="inWishlist()"
                        aria-label="Wishlist"
                        (click)="onWishlist($event)"
                    >
                        <mat-icon [class.bh-icon-fill]="inWishlist()">favorite</mat-icon>
                    </button>
                </div>
            </div>

            <!-- Info panel -->
            <div
                class="relative flex flex-1 flex-col bg-surface-card p-4 shadow-panel"
                style="border-radius: 0 0 var(--radius-md) var(--radius-md)"
            >
                <!-- Описание: растягивается, максимум 3 строки -->
                <div class="min-w-0 flex-1">
                    <div
                        class="line-clamp-3 text-text-primary"
                        style="font: var(--type-product); font-size: var(--fs-18)"
                    >
                        {{ product().title }}
                    </div>
                    <div class="mt-0.5 text-text-secondary/85" style="font: var(--type-caption)">
                        {{ product().vendor }}
                    </div>
                </div>

                <!-- Низ: рейтинг + цена прижаты к низу, минимальный отступ между ними -->
                <div class="mt-3 flex flex-col gap-0.5">
                    @if (product().rating != null) {
                        <bh-rating [value]="product().rating!" [showValue]="true" [size]="18" />
                    }

                    <div class="flex items-baseline gap-1">
                        <span class="text-price" style="font: var(--type-price); font-size: var(--fs-20)">{{ product().price }}</span>
                        <span class="text-text-secondary/85" style="font: var(--type-caption)"
                            >/{{ product().unit }}</span
                        >
                        @if (product().oldPrice) {
                            <span class="ml-1 text-danger line-through" style="font: var(--type-caption)"
                                >{{ product().oldPrice }}</span
                            >
                        }
                    </div>
                </div>
            </div>
        </mat-card>
    `,
    styles: `
        /* Снимаем дефолтные паддинги/фон mat-card — карточка несёт свой glass-вид. */
        .bh-product-card.mat-mdc-card {
            border: 0;
            background: var(--glass-fill);
            overflow: visible;
        }
        /* Кнопки-иконки ховер-оверлея над фото. */
        .bh-ov-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: var(--radius-pill);
            background: rgb(var(--color-white));
            color: rgb(var(--color-text-inverse));
            box-shadow: var(--shadow-glass);
            cursor: pointer;
            transition:
                color 150ms ease,
                transform 150ms ease;
        }
        .bh-ov-btn:hover {
            color: rgb(var(--color-accent));
            transform: translateY(-1px);
        }
    `,
})
export class ProductCardComponent {
    readonly product = input.required<Product>();
    readonly addLabel = input('Add to cart');
    /** В вишлисте ли товар — управляет иконкой сердца (полное/контур). */
    readonly inWishlist = input(false);

    readonly addToCart = output<Product>();
    readonly cardClick = output<Product>();
    /** Клик по фото/иконке галереи — открыть лайтбокс. */
    readonly openGallery = output<Product>();
    /** Клик по «в корзину» — открыть попап с полным описанием. */
    readonly openDetails = output<Product>();
    /** Тоггл вишлиста. */
    readonly toggleWishlist = output<Product>();

    protected onGallery(e: Event): void {
        e.stopPropagation();
        this.openGallery.emit(this.product());
    }

    protected onView(e: Event): void {
        e.stopPropagation();
        this.cardClick.emit(this.product());
    }

    protected onDetails(e: Event): void {
        e.stopPropagation();
        this.openDetails.emit(this.product());
    }

    protected onWishlist(e: Event): void {
        e.stopPropagation();
        this.toggleWishlist.emit(this.product());
    }
}
