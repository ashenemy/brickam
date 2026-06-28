import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { BreadcrumbComponent } from '@brickam/ui-kit';
import { SeoService } from '../seo/seo.service';
import { CatalogApiService } from './catalog-api.service';
import type { ProductDetail } from './models';
import { ProductDetailsViewComponent } from './product-details-view.component';

/**
 * Детальная карточка товара (route /product/:slug): загрузка по slug, хлебные
 * крошки, SEO-теги. Сам контент (медиа/инфо) — переиспользуемый
 * `app-product-details-view` (тот же, что в попапе из карточки товара).
 */
@Component({
    selector: 'app-product-detail',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [BreadcrumbComponent, ProductDetailsViewComponent],
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
                <app-product-details-view [product]="product()!" />
            </article>
        }
    `,
})
export class ProductDetailComponent {
    private readonly api = inject(CatalogApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly i18n = inject(LanguageService);
    private readonly seo = inject(SeoService);

    protected readonly lang = this.i18n.lang;
    protected readonly loading = signal(true);
    protected readonly error = signal(false);
    protected readonly product = signal<ProductDetail | undefined>(undefined);

    constructor() {
        // Загрузка по slug из маршрута.
        this.route.paramMap.subscribe((params) => {
            const slug = params.get('slug');
            if (slug) {
                this.load(slug);
            }
        });

        // SEO из товара.
        effect(() => {
            const p = this.product();
            if (!p) {
                return;
            }
            const lang = this.lang();
            this.seo.set({
                title: p.title[lang],
                description: p.description[lang],
                image: p.cover.url,
                type: 'product',
            });
        });
    }

    private load(slug: string): void {
        this.loading.set(true);
        this.error.set(false);
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

    protected readonly heading = computed(() => {
        const p = this.product();
        return p ? p.title[this.lang()] : '';
    });

    protected readonly crumbs = computed(() => [
        { label: this.ph('catalog'), href: '/catalog' },
        { label: this.heading() },
    ]);

    protected onCrumb(href: string | undefined): void {
        if (href) {
            void this.router.navigateByUrl(href);
        }
    }

    protected ph(key: string): string {
        const full = `catalog.${key}`;
        const translated = this.i18n.t(full);
        return translated !== full ? translated : (DEFAULTS[key] ?? key);
    }
}

const DEFAULTS: Record<string, string> = {
    loading: 'Loading…',
    error: 'Product not found',
    catalog: 'Catalog',
};
