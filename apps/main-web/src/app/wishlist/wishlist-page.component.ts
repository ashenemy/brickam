import { HttpClient } from '@angular/common/http';
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
import { Router } from '@angular/router';
import { RUNTIME_CONFIG } from '@brickam/config-kit/browser';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { type Product, ProductCardComponent } from '@brickam/ui-kit';
import { CatalogApiService } from '../catalog/catalog-api.service';
import type { ProductListItem } from '../catalog/models';
import { WishlistStore } from './wishlist.store';
import { WishlistHeartComponent } from './wishlist-heart.component';

/**
 * Страница вишлиста (route /wishlist). Грузит id из стора, тянет карточки
 * через GET /catalog/products/by-ids, рендерит их с сердечком и «в корзину».
 */
@Component({
    selector: 'app-wishlist',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ProductCardComponent, WishlistHeartComponent],
    template: `
        <section class="flex flex-col gap-6">
            <header class="flex flex-col gap-2">
                <h1 class="text-text-primary" style="font: var(--type-hero)">{{ heading() }}</h1>
            </header>

            @if (loading()) {
                <div class="py-16 text-center text-text-secondary" style="font: var(--type-product)">
                    {{ ph('loading') }}
                </div>
            } @else if (cards().length === 0) {
                <div class="py-16 text-center text-text-secondary" style="font: var(--type-product)">
                    {{ ph('empty') }}
                </div>
            } @else {
                <div
                    class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
                    data-testid="wishlist-grid"
                >
                    @for (item of cards(); track item.id) {
                        <div class="relative">
                            <div class="absolute right-2 top-2 z-10">
                                <app-wishlist-heart [productId]="item.id" />
                            </div>
                            <bh-product-card
                                [product]="item.card"
                                [addLabel]="ph('addToCart')"
                                (cardClick)="openProduct(item.slug)"
                                (addToCart)="addToCart(item.id)"
                            />
                        </div>
                    }
                </div>
            }
        </section>
    `,
})
export class WishlistPageComponent implements OnInit {
    private readonly store = inject(WishlistStore);
    private readonly catalogApi = inject(CatalogApiService);
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);
    private readonly router = inject(Router);
    private readonly i18n = inject(LanguageService);
    private readonly title = inject(Title);

    protected readonly lang = this.i18n.lang;

    protected readonly loading = signal(true);
    private readonly items = signal<ProductListItem[]>([]);

    constructor() {
        // Перезагружаем карточки при изменении набора id в вишлисте.
        effect(() => {
            const ids = [...this.store.ids()];
            this.fetch(ids);
        });

        effect(() => {
            this.title.setTitle(this.heading());
        });
    }

    ngOnInit(): void {
        this.store.load();
    }

    private fetch(ids: string[]): void {
        if (ids.length === 0) {
            this.items.set([]);
            this.loading.set(false);
            return;
        }
        this.loading.set(true);
        this.catalogApi.getProductsByIds(ids).subscribe({
            next: (data) => {
                this.items.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.items.set([]);
                this.loading.set(false);
            },
        });
    }

    protected readonly cards = computed(() =>
        this.items().map((item) => ({
            id: item.id,
            slug: item.slug,
            card: this.toCard(item),
        })),
    );

    private toCard(item: ProductListItem): Product {
        const lang = this.lang();
        const card: Product = {
            id: item.id,
            title: item.title[lang],
            vendor: item.vendorId || '',
            price: this.formatPrice(item.finalPrice),
            unit: item.unit,
            rating: item.ratingAvg,
            image: item.cover.thumbnailUrl ?? item.cover.url,
        };
        if (item.discount) {
            card.oldPrice = this.formatPrice(item.price);
        }
        return card;
    }

    private formatPrice(value: number): string {
        return `${value.toLocaleString('ru-RU')} ֏`;
    }

    protected openProduct(slug: string): void {
        void this.router.navigate(['/product', slug]);
    }

    /** В корзину: POST /cart/items, затем убрать из вишлиста. */
    protected addToCart(productId: string): void {
        const base = this.config.apiBaseUrl.replace(/\/$/, '');
        this.http.post(`${base}/cart/items`, { productId, qty: 1 }).subscribe({
            next: () => this.store.remove(productId),
            error: () => undefined,
        });
    }

    protected readonly heading = computed(() => this.ph('title'));

    protected ph(key: string): string {
        const full = `wishlist.${key}`;
        const translated = this.i18n.t(full);
        if (translated !== full) {
            return translated;
        }
        return DEFAULTS[key] ?? key;
    }
}

const DEFAULTS: Record<string, string> = {
    title: 'Wishlist',
    loading: 'Loading…',
    empty: 'Your wishlist is empty',
    addToCart: 'Add to cart',
};
