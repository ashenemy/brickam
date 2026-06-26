import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
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
 * Сверху белая панель с фото, снизу инфо-панель (название/поставщик/цена), кнопка
 * «Add to cart» (matButton) проявляется при наведении/фокусе. Бейдж/рейтинг — core
 * на Material. Адаптив: занимает ширину ячейки сетки (2 колонки на мобиле).
 */
@Component({
    selector: 'bh-product-card',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatCard, MatButton, MatIcon, BadgeComponent, RatingComponent],
    template: `
        <mat-card
            appearance="outlined"
            class="bh-product-card group block w-full cursor-pointer rounded-xl bg-[var(--glass-fill)] p-2 backdrop-blur-glass shadow-glass transition-[box-shadow,transform] duration-base ease-soft hover:-translate-y-0.5 hover:shadow-glass-hover"
            (click)="cardClick.emit(product())"
        >
            <!-- Image panel -->
            <div
                class="relative aspect-square overflow-hidden bg-white"
                style="border-radius: var(--radius-lg) var(--radius-lg) 8px 8px"
            >
                @if (product().image) {
                    <img
                        [src]="product().image"
                        [alt]="product().title"
                        class="h-full w-full object-cover transition-transform duration-slow ease-out group-hover:scale-105"
                    />
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
                    <span class="absolute left-3 top-3">
                        <bh-badge tone="accent">{{ product().badge }}</bh-badge>
                    </span>
                }
            </div>

            <!-- Info panel -->
            <div
                class="relative mt-1 bg-surface-card p-4 shadow-panel"
                style="border-radius: 8px 8px var(--radius-xl) var(--radius-xl)"
            >
                <div class="min-h-10 text-text-primary" style="font: var(--type-product)">
                    {{ product().title }}
                </div>
                <div class="mt-0.5 text-text-secondary/85" style="font: var(--type-caption)">
                    {{ product().vendor }}
                </div>

                @if (product().rating != null) {
                    <div class="mt-1.5">
                        <bh-rating [value]="product().rating!" [showValue]="true" [size]="14" />
                    </div>
                }

                <div class="mt-2 flex items-end justify-between gap-2">
                    <div class="min-w-0">
                        <div class="flex items-baseline gap-2">
                            <span class="text-price" style="font: var(--type-price)">{{ product().price }}</span>
                            @if (product().oldPrice) {
                                <span
                                    class="text-danger line-through"
                                    style="font: var(--type-caption)"
                                    >{{ product().oldPrice }}</span
                                >
                            }
                        </div>
                        <div class="text-text-secondary/85" style="font: var(--type-caption)">
                            {{ product().unit }}
                        </div>
                    </div>

                    <button
                        matButton="outlined"
                        class="bh-add-btn shrink-0 opacity-0 translate-y-1 transition-[opacity,transform] duration-base ease-out group-hover:opacity-100 group-hover:translate-y-0 focus-visible:opacity-100 focus-visible:translate-y-0"
                        [attr.aria-label]="addLabel() + ': ' + product().title"
                        (click)="onAdd($event)"
                    >
                        {{ addLabel() }}
                        <ng-content select="[slot=cart-icon]">
                            <mat-icon>shopping_cart</mat-icon>
                        </ng-content>
                    </button>
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
        .bh-add-btn {
            font-family: var(--font-display);
        }
    `,
})
export class ProductCardComponent {
    readonly product = input.required<Product>();
    readonly addLabel = input('Add to cart');
    readonly addToCart = output<Product>();
    readonly cardClick = output<Product>();

    protected onAdd(event: MouseEvent): void {
        event.stopPropagation();
        this.addToCart.emit(this.product());
    }
}
