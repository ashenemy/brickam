import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    type OnInit,
    signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LanguageService } from '@brickam/i18n-kit/browser';
import {
    ButtonComponent,
    CheckboxComponent,
    type Product,
    ProductCardComponent,
    SelectComponent,
} from '@brickam/ui-kit';
import { CurrencyStore } from '../currency/currency.store';
import { SeoService } from '../seo/seo.service';
import { WishlistHeartComponent } from '../wishlist/wishlist-heart.component';
import { CatalogApiService } from './catalog-api.service';
import type { Category, PageMeta, ProductFilters, ProductListItem, ProductSort } from './models';

const PAGE_SIZE = 12;

/**
 * Каталог + поиск товаров (route /catalog). Единая страница: поиск из шапки
 * приходит через ?q=, категория — через ?category=<slug>. Фильтры — слева,
 * сетка справа. Серверная фильтрация/пагинация, всё реактивно по сигналам.
 */
@Component({
    selector: 'app-catalog-list',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ProductCardComponent,
        SelectComponent,
        CheckboxComponent,
        ButtonComponent,
        WishlistHeartComponent,
    ],
    template: `
        <section class="flex flex-col gap-6 lg:flex-row lg:items-start">
            <!-- Боковая панель фильтров -->
            <aside
                class="flex flex-col gap-5 rounded-lg bg-surface-card p-5 shadow-glass lg:sticky lg:top-4 lg:w-72 lg:shrink-0"
                data-testid="catalog-filters"
            >
                <div class="flex items-center justify-between">
                    <h2 class="m-0 text-text-primary" style="font: var(--type-section)">
                        {{ ph('filters') }}
                    </h2>
                    @if (hasFilters()) {
                        <button
                            type="button"
                            (click)="clearFilters()"
                            class="text-accent hover:underline"
                            style="font: var(--type-caption)"
                            data-testid="catalog-clear"
                        >
                            {{ ph('clear') }}
                        </button>
                    }
                </div>

                <label class="flex flex-col gap-1">
                    <span class="text-text-secondary" style="font: var(--type-label)">{{ ph('search') }}</span>
                    <input
                        type="search"
                        [value]="q()"
                        [placeholder]="ph('search')"
                        (input)="onSearch($event)"
                        aria-label="Search products"
                        class="w-full h-12 px-4 rounded-md border-0 outline-none bg-[rgb(var(--color-neutral-900)/0.9)] text-text-primary font-input text-16 shadow-[inset_0_0_0_1px_var(--border-subtle),var(--shadow-inset)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                    />
                </label>

                <bh-select
                    [label]="ph('category')"
                    [options]="categoryOptions()"
                    [placeholder]="ph('allCategories')"
                    [value]="categoryId() ?? ''"
                    (changed)="onCategory($event)"
                />

                <div class="flex flex-col gap-1">
                    <span class="text-text-secondary" style="font: var(--type-label)">{{ ph('price') }}</span>
                    <div class="flex gap-2">
                        <input
                            type="number"
                            inputmode="numeric"
                            [value]="minPrice() ?? ''"
                            [placeholder]="ph('minPrice')"
                            (input)="onMinPrice($event)"
                            aria-label="Min price"
                            class="w-full h-12 px-3 rounded-md border-0 outline-none bg-[rgb(var(--color-neutral-900)/0.9)] text-text-primary font-input text-16 shadow-[inset_0_0_0_1px_var(--border-subtle),var(--shadow-inset)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                        />
                        <input
                            type="number"
                            inputmode="numeric"
                            [value]="maxPrice() ?? ''"
                            [placeholder]="ph('maxPrice')"
                            (input)="onMaxPrice($event)"
                            aria-label="Max price"
                            class="w-full h-12 px-3 rounded-md border-0 outline-none bg-[rgb(var(--color-neutral-900)/0.9)] text-text-primary font-input text-16 shadow-[inset_0_0_0_1px_var(--border-subtle),var(--shadow-inset)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                        />
                    </div>
                </div>

                <bh-select
                    [label]="ph('minRating')"
                    [options]="ratingOptions()"
                    [value]="minRating()"
                    (changed)="onRating($event)"
                />

                <bh-checkbox [value]="inStock()" (changed)="onStock($event)">
                    {{ ph('inStock') }}
                </bh-checkbox>
            </aside>

            <!-- Результаты -->
            <div class="flex min-w-0 flex-1 flex-col gap-4">
                <header class="flex flex-wrap items-center justify-between gap-3">
                    <h1 class="m-0 text-text-primary" style="font: var(--type-hero)">{{ heading() }}</h1>
                    <div class="w-full sm:w-52">
                        <bh-select
                            [label]="ph('sort')"
                            [options]="sortOptions()"
                            [value]="sort()"
                            (changed)="onSort($event)"
                        />
                    </div>
                </header>

                @if (!loading() && !error() && cards().length > 0) {
                    <p class="text-text-secondary" style="font: var(--type-caption)" data-testid="catalog-count">
                        {{ ph('found') }}: {{ metaInfo()?.total ?? cards().length }}
                    </p>
                }

                <!-- Состояния -->
                @if (loading()) {
                    <div class="py-16 text-center text-text-secondary" style="font: var(--type-product)">
                        {{ ph('loading') }}
                    </div>
                } @else if (error()) {
                    <div class="py-16 text-center text-danger" style="font: var(--type-product)">
                        {{ ph('error') }}
                    </div>
                } @else if (cards().length === 0) {
                    <div class="py-16 text-center text-text-secondary" style="font: var(--type-product)">
                        {{ ph('empty') }}
                    </div>
                } @else {
                    <div
                        class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
                        data-testid="product-grid"
                    >
                        @for (item of cards(); track item.slug) {
                            <div class="relative">
                                <div class="absolute right-2 top-2 z-10">
                                    <app-wishlist-heart [productId]="item.card.id + ''" />
                                </div>
                                <bh-product-card
                                    [product]="item.card"
                                    (cardClick)="openProduct(item.slug)"
                                    (addToCart)="openProduct(item.slug)"
                                />
                            </div>
                        }
                    </div>

                    <!-- Пагинация -->
                    <nav class="flex items-center justify-center gap-4 pt-2" aria-label="Pagination">
                        <bh-button
                            variant="secondary"
                            [disabled]="!metaInfo()?.hasPrev"
                            (clicked)="prevPage()"
                        >
                            {{ ph('prev') }}
                        </bh-button>
                        <span class="text-text-secondary" style="font: var(--type-caption)">
                            {{ page() }} / {{ metaInfo()?.totalPages ?? 1 }}
                        </span>
                        <bh-button
                            variant="secondary"
                            [disabled]="!metaInfo()?.hasNext"
                            (clicked)="nextPage()"
                        >
                            {{ ph('next') }}
                        </bh-button>
                    </nav>
                }
            </div>
        </section>
    `,
})
export class CatalogListComponent implements OnInit {
    private readonly api = inject(CatalogApiService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly i18n = inject(LanguageService);
    private readonly seo = inject(SeoService);
    private readonly currencyStore = inject(CurrencyStore);

    protected readonly lang = this.i18n.lang;

    // Фильтры (signals)
    protected readonly q = signal('');
    protected readonly categoryId = signal<string | undefined>(undefined);
    protected readonly minPrice = signal<number | undefined>(undefined);
    protected readonly maxPrice = signal<number | undefined>(undefined);
    protected readonly minRating = signal<string>('');
    protected readonly inStock = signal(false);
    protected readonly sort = signal<ProductSort>('newest');
    protected readonly page = signal(1);

    // Состояние
    protected readonly loading = signal(false);
    protected readonly error = signal(false);
    protected readonly items = signal<ProductListItem[]>([]);
    protected readonly metaSig = signal<PageMeta | undefined>(undefined);
    protected readonly categories = signal<Category[]>([]);

    constructor() {
        // Перезапрос при изменении любого фильтра/страницы.
        effect(() => {
            const filters: ProductFilters = {
                page: this.page(),
                pageSize: PAGE_SIZE,
                sort: this.sort(),
            };
            const q = this.q();
            if (q) {
                filters.q = q;
            }
            const cat = this.categoryId();
            if (cat) {
                filters.categoryId = cat;
            }
            const min = this.minPrice();
            if (min !== undefined) {
                filters.minPrice = min;
            }
            const max = this.maxPrice();
            if (max !== undefined) {
                filters.maxPrice = max;
            }
            const rating = this.minRating();
            if (rating) {
                filters.minRating = Number(rating);
            }
            if (this.inStock()) {
                filters.inStock = true;
            }
            this.fetch(filters);
        });

        // SEO-метаданные (статические для листинга, реагируют на язык).
        effect(() => {
            this.seo.set({
                title: this.seoTitle(),
                description: this.ph('seoDescription'),
                type: 'website',
            });
        });
    }

    ngOnInit(): void {
        // Поиск из шапки приходит как ?q=, slug категории — как ?category=<slug>.
        const qParam = this.route.snapshot.queryParamMap.get('q');
        if (qParam) {
            this.q.set(qParam);
        }
        const categorySlug = this.route.snapshot.queryParamMap.get('category') ?? undefined;
        this.api.getCategories().subscribe({
            next: (cats) => {
                this.categories.set(cats);
                if (categorySlug) {
                    const match = cats.find((c) => c.slug === categorySlug);
                    if (match) {
                        this.categoryId.set(match.id);
                        this.page.set(1);
                    }
                }
            },
            error: () => this.categories.set([]),
        });
    }

    private fetch(filters: ProductFilters): void {
        this.loading.set(true);
        this.error.set(false);
        this.api.getProducts(filters).subscribe({
            next: (res) => {
                this.items.set(res.data);
                this.metaSig.set(res.meta);
                this.loading.set(false);
            },
            error: () => {
                this.items.set([]);
                this.metaSig.set(undefined);
                this.error.set(true);
                this.loading.set(false);
            },
        });
    }

    // Производные данные для шаблона
    protected metaInfo(): PageMeta | undefined {
        return this.metaSig();
    }

    protected readonly cards = computed(() => {
        // Зависимости от валюты — чтобы карточки переформатировались при её смене.
        this.currencyStore.selected();
        this.currencyStore.rates();
        return this.items().map((item) => ({
            slug: item.slug,
            card: this.toCard(item),
        }));
    });

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
        // Цена приходит в AMD (целое); конвертируется только для отображения.
        return this.currencyStore.format(value);
    }

    protected readonly heading = computed(() => this.ph('title'));

    // Заголовок для <title>/og:title — отдельный SEO-ключ с фолбэком на heading.
    protected readonly seoTitle = computed(() => {
        const key = 'seo.catalogTitle';
        const translated = this.i18n.t(key);
        return translated === key ? this.heading() : translated;
    });

    protected readonly categoryOptions = computed(() => {
        const lang = this.lang();
        return [
            { label: this.ph('allCategories'), value: '' },
            ...this.categories().map((c) => ({ label: c.name[lang], value: c.id })),
        ];
    });

    protected readonly sortOptions = computed(() => [
        { label: this.ph('sortNewest'), value: 'newest' },
        { label: this.ph('sortPriceAsc'), value: 'price_asc' },
        { label: this.ph('sortPriceDesc'), value: 'price_desc' },
        { label: this.ph('sortRating'), value: 'rating_desc' },
    ]);

    protected readonly ratingOptions = computed(() => [
        { label: this.ph('anyRating'), value: '' },
        { label: '4★+', value: '4' },
        { label: '3★+', value: '3' },
        { label: '2★+', value: '2' },
    ]);

    /** Хотя бы один фильтр активен — показываем кнопку «Сбросить». */
    protected readonly hasFilters = computed(
        () =>
            !!this.q() ||
            this.categoryId() !== undefined ||
            this.minPrice() !== undefined ||
            this.maxPrice() !== undefined ||
            this.minRating() !== '' ||
            this.inStock(),
    );

    /** Сброс всех фильтров на дефолт и возврат на 1-ю страницу. */
    protected clearFilters(): void {
        this.q.set('');
        this.categoryId.set(undefined);
        this.minPrice.set(undefined);
        this.maxPrice.set(undefined);
        this.minRating.set('');
        this.inStock.set(false);
        this.page.set(1);
    }

    // Хендлеры фильтров — сброс на 1-ю страницу.
    protected onSearch(event: Event): void {
        this.q.set((event.target as HTMLInputElement).value);
        this.page.set(1);
    }

    protected onCategory(value: string | number): void {
        const v = String(value);
        this.categoryId.set(v === '' ? undefined : v);
        this.page.set(1);
    }

    protected onRating(value: string | number): void {
        this.minRating.set(String(value));
        this.page.set(1);
    }

    protected onStock(checked: boolean): void {
        this.inStock.set(checked);
        this.page.set(1);
    }

    protected onMinPrice(event: Event): void {
        this.minPrice.set(this.parseNum(event));
        this.page.set(1);
    }

    protected onMaxPrice(event: Event): void {
        this.maxPrice.set(this.parseNum(event));
        this.page.set(1);
    }

    protected onSort(value: string | number): void {
        this.sort.set(String(value) as ProductSort);
        this.page.set(1);
    }

    private parseNum(event: Event): number | undefined {
        const raw = (event.target as HTMLInputElement).value;
        if (raw === '') {
            return undefined;
        }
        const n = Number(raw);
        return Number.isFinite(n) ? n : undefined;
    }

    protected prevPage(): void {
        if (this.metaSig()?.hasPrev) {
            this.page.update((p) => Math.max(1, p - 1));
        }
    }

    protected nextPage(): void {
        if (this.metaSig()?.hasNext) {
            this.page.update((p) => p + 1);
        }
    }

    protected openProduct(slug: string): void {
        void this.router.navigate(['/product', slug]);
    }

    // Локализованные подписи с фолбэком на дефолтные строки.
    protected ph(key: string): string {
        const full = `catalog.${key}`;
        const translated = this.i18n.t(full);
        if (translated !== full) {
            return translated;
        }
        return DEFAULTS[key] ?? key;
    }
}

const DEFAULTS: Record<string, string> = {
    title: 'Catalog',
    filters: 'Filters',
    clear: 'Clear',
    found: 'Found',
    search: 'Search products…',
    category: 'Category',
    allCategories: 'All categories',
    price: 'Price, ֏',
    minPrice: 'Min ֏',
    maxPrice: 'Max ֏',
    minRating: 'Rating',
    anyRating: 'Any rating',
    inStock: 'In stock only',
    sort: 'Sort',
    loading: 'Loading…',
    error: 'Failed to load products',
    empty: 'No products found',
    prev: 'Previous',
    next: 'Next',
    sortNewest: 'Newest',
    sortPriceAsc: 'Price: low to high',
    sortPriceDesc: 'Price: high to low',
    sortRating: 'Top rated',
    seoDescription: 'Browse construction materials from trusted vendors across Armenia.',
};
