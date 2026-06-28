import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    type OnInit,
    signal,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import { LanguageService } from '@brickam/i18n-kit/browser';
import {
    FeatureBarComponent,
    type FeatureItem,
    type Product,
    ProductCardComponent,
    RoomCardComponent,
} from '@brickam/ui-kit';
import { catchError, map, of } from 'rxjs';
import { CatalogApiService } from './catalog/catalog-api.service';
import type { Category, ProductListItem } from './catalog/models';
import { CurrencyStore } from './currency/currency.store';
import { SeoService } from './seo/seo.service';

/** Раскладка бенто «Shop by room»: первая плитка большая, остальные — сеткой. */
const BENTO_AREAS = ['a', 'b', 'c', 'd', 'e'];

/** Trust-бар — курируемый маркетинговый блок (i18n-ключи + фолбэки). */
const FEATURES: {
    icon: string;
    titleKey: string;
    titleFb: string;
    subKey: string;
    subFb: string;
}[] = [
    {
        icon: 'local_shipping',
        titleKey: 'home.feature.delivery.title',
        titleFb: 'Fast Delivery',
        subKey: 'home.feature.delivery.subtitle',
        subFb: 'Delivery in 48 h',
    },
    {
        icon: 'autorenew',
        titleKey: 'home.feature.return.title',
        titleFb: '24 Hours Return',
        subKey: 'home.feature.return.subtitle',
        subFb: '100% money-back guarantee',
    },
    {
        icon: 'shield',
        titleKey: 'home.feature.payment.title',
        titleFb: 'Secure Payment',
        subKey: 'home.feature.payment.subtitle',
        subFb: 'Your money is safe',
    },
    {
        icon: 'support_agent',
        titleKey: 'home.feature.support.title',
        titleFb: 'Support 24/7',
        subKey: 'home.feature.support.subtitle',
        subFb: 'Live contact / message',
    },
];

const BEST_DEALS_COUNT = 10;

@Component({
    selector: 'app-home',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatIcon, RoomCardComponent, FeatureBarComponent, ProductCardComponent],
    template: `
        <div class="flex flex-col gap-10 md:gap-14">
            <!-- Shop by room (курируемый блок) -->
            <section>
                <header class="mb-5 flex items-center gap-3">
                    <h2 class="m-0 text-text-primary" style="font: var(--type-h1); font-size: 26px">
                        {{ tr('home.shopByRoom', 'Shop by room') }}
                    </h2>
                    <mat-icon class="text-accent">arrow_forward</mat-icon>
                </header>
                @if (rooms().length) {
                    <div class="bh-bento">
                        @for (room of rooms(); track room.slug) {
                            <bh-room-card
                                class="block"
                                [style.grid-area]="room.area"
                                [image]="room.cover"
                                [label]="room.label"
                                (cardClick)="goCategory(room.slug)"
                            />
                        }
                    </div>
                }
            </section>

            <bh-feature-bar [items]="features()" />

            <!-- Best deals (реальные товары из API) -->
            <section>
                <header class="mb-5 flex items-center gap-3">
                    <h2 class="m-0 text-text-primary" style="font: var(--type-h1); font-size: 26px">
                        {{ tr('home.bestDeals', 'Best deals') }}
                    </h2>
                    <mat-icon class="text-accent">arrow_forward</mat-icon>
                </header>

                @if (loading()) {
                    <div class="py-12 text-center text-text-secondary" style="font: var(--type-product)">
                        {{ tr('home.loading', 'Loading…') }}
                    </div>
                } @else if (cards().length === 0) {
                    <div class="py-12 text-center text-text-secondary" style="font: var(--type-product)">
                        {{ tr('home.noProducts', 'No products yet') }}
                    </div>
                } @else {
                    <div class="bh-product-grid">
                        @for (item of cards(); track item.slug) {
                            <bh-product-card
                                [product]="item.card"
                                (cardClick)="openProduct(item.slug)"
                                (addToCart)="openProduct(item.slug)"
                            />
                        }
                    </div>
                }
            </section>
        </div>
    `,
    styles: `
        .bh-bento {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 240px 170px 170px;
            grid-template-areas: 'a a' 'b c' 'd e';
            gap: 12px;
        }
        @media (min-width: 768px) {
            .bh-bento {
                grid-template-columns: repeat(3, 1fr);
                grid-template-rows: 206px 206px;
                grid-template-areas: 'a b c' 'a d e';
                gap: 16px;
            }
        }
        .bh-bento bh-room-card,
        .bh-bento ::ng-deep .mat-mdc-card,
        .bh-bento ::ng-deep a {
            height: 100% !important;
            min-width: 0;
        }
        .bh-product-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            align-items: start;
        }
        @media (min-width: 640px) {
            .bh-product-grid {
                grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                gap: 22px;
            }
        }
    `,
})
export class HomeComponent implements OnInit {
    private readonly i18n = inject(LanguageService);
    private readonly seo = inject(SeoService);
    private readonly api = inject(CatalogApiService);
    private readonly currencyStore = inject(CurrencyStore);
    private readonly router = inject(Router);

    protected readonly lang = this.i18n.lang;

    /** Локализованный trust-бар (реагирует на смену языка). */
    protected readonly features = computed<FeatureItem[]>(() =>
        FEATURES.map((f) => ({
            icon: f.icon,
            title: this.tr(f.titleKey, f.titleFb),
            subtitle: this.tr(f.subKey, f.subFb),
        })),
    );

    protected readonly loading = signal(true);
    private readonly items = signal<ProductListItem[]>([]);
    private readonly categories = signal<Category[]>([]);

    /** Featured-категории для «Shop by room» (флаг featuredOnHome из API). */
    protected readonly rooms = computed(() => {
        const lang = this.lang();
        return this.categories()
            .filter((c) => c.featuredOnHome)
            .sort((a, b) => a.order - b.order)
            .slice(0, BENTO_AREAS.length)
            .map((c, i) => ({
                slug: c.slug,
                area: BENTO_AREAS[i],
                label: c.name[lang],
                cover: c.coverUrl ?? '',
            }));
    });

    /** Карточки переформатируются при смене валюты/языка. */
    protected readonly cards = computed(() => {
        this.currencyStore.selected();
        this.currencyStore.rates();
        this.lang();
        return this.items().map((item) => ({ slug: item.slug, card: this.toCard(item) }));
    });

    constructor() {
        effect(() => {
            this.i18n.lang();
            const title = this.tr('seo.siteTitle', 'Brickam — Construction materials marketplace');
            const description = this.tr(
                'seo.siteDescription',
                'Brickam — marketplace of construction materials in Armenia. Dozens of trusted vendors, delivery within 48 hours.',
            );
            this.seo.set({ title, description, type: 'website' });
        });
    }

    ngOnInit(): void {
        // «Best deals» — топ по рейтингу из реального каталога. Рендерится и на
        // сервере (SSR + TransferState), и в браузере. timeout — страховка: если
        // API недоступен/медленный, запрос гарантированно завершится и SSR
        // стабилизируется (не зависнет на pending task).
        this.api
            .getProducts({ page: 1, pageSize: BEST_DEALS_COUNT, sort: 'rating_desc' })
            .pipe(
                map((res) => res.data),
                catchError(() => of([] as ProductListItem[])),
            )
            .subscribe((data) => {
                this.items.set(data);
                this.loading.set(false);
            });

        // Featured-категории для блока «Shop by room».
        this.api
            .getCategories()
            .pipe(catchError(() => of([] as Category[])))
            .subscribe((cats) => this.categories.set(cats));
    }

    private toCard(item: ProductListItem): Product {
        const lang = this.lang();
        const card: Product = {
            id: item.id,
            title: item.title[lang],
            vendor: item.vendorId || '',
            price: this.currencyStore.format(item.finalPrice),
            unit: item.unit,
            rating: item.ratingAvg,
            image: item.cover.thumbnailUrl ?? item.cover.url,
        };
        if (item.discount) {
            card.oldPrice = this.currencyStore.format(item.price);
        }
        return card;
    }

    protected goCategory(slug: string): void {
        void this.router.navigate(['/catalog'], { queryParams: { category: slug } });
    }

    protected openProduct(slug: string): void {
        void this.router.navigate(['/product', slug]);
    }

    protected tr(key: string, fallback: string): string {
        const value = this.i18n.t(key);
        return value === key ? fallback : value;
    }
}
