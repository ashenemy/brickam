import { isPlatformBrowser } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    type ElementRef,
    effect,
    inject,
    input,
    type OnDestroy,
    PLATFORM_ID,
    type Signal,
    signal,
    viewChild,
} from '@angular/core';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { ButtonComponent } from '@brickam/ui-kit';
import { CartStore } from '../cart/cart.store';
import { CurrencyDisplayPipe } from '../currency/currency-display.pipe';
import { WishlistHeartComponent } from '../wishlist/wishlist-heart.component';
import type { Media, ProductDetail } from './models';

/**
 * Презентационный блок «медиа + инфо» детальной карточки товара. Принимает
 * `ProductDetail` и используется 1:1 на странице /product/:slug и в попапе
 * (из карточки товара). Видео-обложка с автоплеем по вьюпорту, галерея,
 * локализованные заголовок/описание, цена/скидка, атрибуты, в корзину, вишлист.
 */
@Component({
    selector: 'app-product-details-view',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonComponent, WishlistHeartComponent, CurrencyDisplayPipe],
    template: `
        <div class="flex flex-col gap-8 lg:flex-row">
            <!-- Медиа -->
            <div class="flex flex-col gap-3 lg:w-1/2">
                <div class="relative aspect-square w-full overflow-hidden rounded-md bg-surface-card-alt">
                    @if (activeMedia(); as m) {
                        @if (m.mediaType === 'video' && !videoFailed()) {
                            <video
                                #coverVideo
                                class="absolute inset-0 h-full w-full object-cover"
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
                                class="absolute inset-0 h-full w-full object-cover"
                            />
                        } @else {
                            <img
                                [src]="m.url"
                                [alt]="heading()"
                                class="absolute inset-0 h-full w-full object-cover"
                            />
                        }
                    }
                </div>

                <!-- Галерея -->
                @if (gallery().length > 1) {
                    <div class="flex gap-3 overflow-x-auto">
                        @for (g of gallery(); track $index) {
                            <button
                                type="button"
                                class="h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-md border-0 bg-surface-card-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                                [attr.aria-label]="ph('galleryItem') + ' ' + ($index + 1)"
                                (click)="selectMedia($index)"
                            >
                                <img [src]="g.thumbnailUrl ?? g.url" alt="" class="h-full w-full object-cover" />
                            </button>
                        }
                    </div>
                }
            </div>

            <!-- Инфо -->
            <div class="flex flex-col gap-5 lg:w-1/2">
                <h1 class="text-text-primary" style="font: var(--type-hero)">{{ heading() }}</h1>

                <div class="flex items-baseline gap-3">
                    <span class="text-price" style="font: var(--type-price)">
                        {{ product().finalPrice | currencyDisplay }}
                    </span>
                    @if (product().discount) {
                        <span class="text-danger line-through" style="font: var(--type-product)">
                            {{ product().price | currencyDisplay }}
                        </span>
                    }
                    <span class="text-text-secondary" style="font: var(--type-caption)">
                        {{ product().unit }}
                    </span>
                </div>

                <p class="max-w-content text-text-secondary" style="font: var(--type-product)">
                    {{ description() }}
                </p>

                @if (product().attributes.length) {
                    <dl class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        @for (attr of product().attributes; track attr.key) {
                            <div
                                class="flex justify-between gap-3 border-b border-[var(--border-subtle)] pb-1"
                            >
                                <dt class="text-text-tertiary" style="font: var(--type-caption)">
                                    {{ attr.key }}
                                </dt>
                                <dd class="text-right text-text-primary" style="font: var(--type-caption)">
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
                    <app-wishlist-heart [productId]="product().id" [size]="48" />
                </div>
            </div>
        </div>
    `,
})
export class ProductDetailsViewComponent implements OnDestroy {
    readonly product = input.required<ProductDetail>();

    private readonly i18n = inject(LanguageService);
    private readonly cart = inject(CartStore);
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    protected readonly lang = this.i18n.lang;
    protected readonly activeIndex = signal(0);
    protected readonly videoFailed = signal(false);

    private readonly coverVideo: Signal<ElementRef<HTMLVideoElement> | undefined> =
        viewChild('coverVideo');
    private observer: IntersectionObserver | undefined;

    constructor() {
        // Сброс выбора медиа при смене товара.
        effect(() => {
            this.product();
            this.activeIndex.set(0);
            this.videoFailed.set(false);
        });

        // Автоплей/пауза видео по вьюпорту — только в браузере.
        effect(() => {
            const ref = this.coverVideo();
            if (!this.isBrowser || !ref || typeof IntersectionObserver === 'undefined') {
                return;
            }
            this.attachObserver(ref.nativeElement);
        });
    }

    protected readonly gallery = computed<Media[]>(() => {
        const p = this.product();
        return p.gallery.length ? p.gallery : [p.cover];
    });

    protected readonly activeMedia = computed<Media | undefined>(() => {
        const g = this.gallery();
        if (!g.length) {
            return this.product().cover;
        }
        return g[Math.min(this.activeIndex(), g.length - 1)];
    });

    protected selectMedia(index: number): void {
        this.videoFailed.set(false);
        this.activeIndex.set(index);
    }

    protected readonly heading = computed(() => this.product().title[this.lang()]);
    protected readonly description = computed(() => this.product().description[this.lang()]);

    protected addToCart(): void {
        this.cart.addItem(this.product().id, 1);
    }

    protected ph(key: string): string {
        const full = `catalog.${key}`;
        const translated = this.i18n.t(full);
        return translated !== full ? translated : (DEFAULTS[key] ?? key);
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
}

const DEFAULTS: Record<string, string> = {
    addToCart: 'Add to cart',
    galleryItem: 'Image',
};
