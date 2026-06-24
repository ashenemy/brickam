import { isPlatformBrowser } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    type ElementRef,
    effect,
    inject,
    type OnDestroy,
    PLATFORM_ID,
    type Signal,
    signal,
    viewChild,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { BreadcrumbComponent, ButtonComponent } from '@brickam/ui-kit';
import { WishlistHeartComponent } from '../wishlist/wishlist-heart.component';
import { CatalogApiService } from './catalog-api.service';
import type { Media, ProductDetail } from './models';

/**
 * Детальная карточка товара (route /product/:slug). Видео-обложка с автоплеем
 * по вьюпорту (IntersectionObserver, только в браузере), галерея, локализованные
 * заголовок/описание, цена/скидка, атрибуты, хлебные крошки, SEO-теги.
 */
@Component({
    selector: 'app-product-detail',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [BreadcrumbComponent, ButtonComponent, WishlistHeartComponent],
    template: `
        @if (loading()) {
            <div class="py-16 text-center text-text-secondary" style="font: var(--type-product)">
                {{ ph('loading') }}
            </div>
        } @else if (error() || !product()) {
            <div class="py-16 text-center text-danger" style="font: var(--type-product)">
                {{ ph('error') }}
            </div>
        } @else {
            <article class="flex flex-col gap-6">
                <bh-breadcrumb [items]="crumbs()" (navigated)="onCrumb($event.href)" />

                <div class="flex flex-col gap-8 lg:flex-row">
                    <!-- Медиа -->
                    <div class="flex flex-col gap-3 lg:w-1/2">
                        <div
                            class="relative aspect-square w-full overflow-hidden rounded-xl bg-surface-card-alt"
                        >
                            @if (activeMedia(); as m) {
                                @if (m.mediaType === 'video' && !videoFailed()) {
                                    <video
                                        #coverVideo
                                        class="h-full w-full object-cover"
                                        autoplay
                                        muted
                                        loop
                                        playsinline
                                        [poster]="m.thumbnailUrl ?? ''"
                                        (error)="videoFailed.set(true)"
                                    >
                                        <source [src]="m.url" />
                                    </video>
                                } @else if (m.mediaType === 'video' && videoFailed()) {
                                    <img
                                        [src]="m.thumbnailUrl ?? ''"
                                        [alt]="heading()"
                                        class="h-full w-full object-cover"
                                    />
                                } @else {
                                    <img
                                        [src]="m.url"
                                        [alt]="heading()"
                                        class="h-full w-full object-cover"
                                    />
                                }
                            }
                        </div>

                        <!-- Галерея -->
                        @if (gallery().length > 1) {
                            <div class="flex gap-2 overflow-x-auto">
                                @for (g of gallery(); track $index) {
                                    <button
                                        type="button"
                                        class="h-16 w-16 shrink-0 overflow-hidden rounded-md border-0 cursor-pointer bg-surface-card-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                                        [attr.aria-label]="ph('galleryItem') + ' ' + ($index + 1)"
                                        (click)="selectMedia($index)"
                                    >
                                        <img
                                            [src]="g.thumbnailUrl ?? g.url"
                                            alt=""
                                            class="h-full w-full object-cover"
                                        />
                                    </button>
                                }
                            </div>
                        }
                    </div>

                    <!-- Инфо -->
                    <div class="flex flex-col gap-5 lg:w-1/2">
                        <h1 class="text-text-primary" style="font: var(--type-hero)">
                            {{ heading() }}
                        </h1>

                        <div class="flex items-baseline gap-3">
                            <span class="text-price" style="font: var(--type-price)">
                                {{ formatPrice(product()!.finalPrice) }}
                            </span>
                            @if (product()!.discount) {
                                <span
                                    class="text-danger line-through"
                                    style="font: var(--type-product)"
                                >
                                    {{ formatPrice(product()!.price) }}
                                </span>
                            }
                            <span class="text-text-secondary" style="font: var(--type-caption)">
                                {{ product()!.unit }}
                            </span>
                        </div>

                        <p class="text-text-secondary max-w-content" style="font: var(--type-product)">
                            {{ description() }}
                        </p>

                        @if (product()!.attributes.length) {
                            <dl class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                @for (attr of product()!.attributes; track attr.key) {
                                    <div class="flex justify-between gap-3 border-b border-[var(--border-subtle)] pb-1">
                                        <dt class="text-text-tertiary" style="font: var(--type-caption)">
                                            {{ attr.key }}
                                        </dt>
                                        <dd class="text-text-primary text-right" style="font: var(--type-caption)">
                                            {{ attr.value }}
                                        </dd>
                                    </div>
                                }
                            </dl>
                        }

                        <div class="flex items-center gap-3 pt-2">
                            <bh-button variant="primary" size="lg" (clicked)="addToCart()">
                                {{ ph('addToCart') }}
                            </bh-button>
                            <app-wishlist-heart [productId]="product()!.id" [size]="48" />
                        </div>
                    </div>
                </div>
            </article>
        }
    `,
})
export class ProductDetailComponent implements OnDestroy {
    private readonly api = inject(CatalogApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly i18n = inject(LanguageService);
    private readonly title = inject(Title);
    private readonly meta = inject(Meta);
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);

    protected readonly lang = this.i18n.lang;

    protected readonly loading = signal(true);
    protected readonly error = signal(false);
    protected readonly product = signal<ProductDetail | undefined>(undefined);
    protected readonly activeIndex = signal(0);
    protected readonly videoFailed = signal(false);

    private readonly coverVideo: Signal<ElementRef<HTMLVideoElement> | undefined> =
        viewChild('coverVideo');
    private observer: IntersectionObserver | undefined;

    constructor() {
        // Загрузка по slug из маршрута.
        this.route.paramMap.subscribe((params) => {
            const slug = params.get('slug');
            if (slug) {
                this.load(slug);
            }
        });

        // Автоплей/пауза видео по вьюпорту — только в браузере.
        effect(() => {
            const ref = this.coverVideo();
            if (!this.isBrowser || !ref || typeof IntersectionObserver === 'undefined') {
                return;
            }
            this.attachObserver(ref.nativeElement);
        });

        // SEO из товара.
        effect(() => {
            const p = this.product();
            if (!p) {
                return;
            }
            const t = p.title[this.lang()];
            const desc = p.description[this.lang()];
            const image = p.cover.thumbnailUrl ?? p.cover.url;
            this.title.setTitle(t);
            this.meta.updateTag({ name: 'description', content: desc });
            this.meta.updateTag({ property: 'og:title', content: t });
            this.meta.updateTag({ property: 'og:description', content: desc });
            this.meta.updateTag({ property: 'og:image', content: image });
            this.meta.updateTag({ property: 'og:type', content: 'product' });
        });
    }

    private load(slug: string): void {
        this.loading.set(true);
        this.error.set(false);
        this.videoFailed.set(false);
        this.activeIndex.set(0);
        this.api.getProduct(slug).subscribe({
            next: (p) => {
                this.product.set(p);
                this.loading.set(false);
            },
            error: () => {
                this.product.set(undefined);
                this.error.set(true);
                this.loading.set(false);
            },
        });
    }

    private attachObserver(video: HTMLVideoElement): void {
        this.observer?.disconnect();
        this.observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        void video.play().catch(() => undefined);
                    } else {
                        video.pause();
                    }
                }
            },
            { threshold: 0.25 },
        );
        this.observer.observe(video);
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
    }

    protected readonly gallery = computed<Media[]>(() => {
        const p = this.product();
        if (!p) {
            return [];
        }
        return p.gallery.length ? p.gallery : [p.cover];
    });

    protected readonly activeMedia = computed<Media | undefined>(() => {
        const g = this.gallery();
        if (!g.length) {
            return this.product()?.cover;
        }
        return g[Math.min(this.activeIndex(), g.length - 1)];
    });

    protected selectMedia(index: number): void {
        this.videoFailed.set(false);
        this.activeIndex.set(index);
    }

    protected readonly heading = computed(() => {
        const p = this.product();
        return p ? p.title[this.lang()] : '';
    });

    protected readonly description = computed(() => {
        const p = this.product();
        return p ? p.description[this.lang()] : '';
    });

    protected readonly crumbs = computed(() => [
        { label: this.ph('catalog'), href: '/catalog' },
        { label: this.heading() },
    ]);

    protected formatPrice(value: number): string {
        return `${value.toLocaleString('ru-RU')} ֏`;
    }

    protected onCrumb(href: string | undefined): void {
        if (href) {
            void this.router.navigateByUrl(href);
        }
    }

    protected addToCart(): void {
        // Корзина подключится в следующем стейдже; пока no-op.
    }

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
    loading: 'Loading…',
    error: 'Product not found',
    addToCart: 'Add to cart',
    catalog: 'Catalog',
    galleryItem: 'Image',
};
