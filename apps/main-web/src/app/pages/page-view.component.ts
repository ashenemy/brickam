import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { SeoService } from '../seo/seo.service';
import type { CmsPage } from './models';
import { PagesApiService } from './pages-api.service';

/**
 * Публичная CMS-страница (route /p/:slug): about/terms/privacy и пр.
 * Грузит опубликованную страницу, рендерит локализованные title + content.
 * Контент рендерится через [innerHTML] (Angular санитизирует разметку);
 * для простого текста переносы строк сохраняются через whitespace-pre-line.
 * Ставит SEO-мету из seoTitle/seoDescription (фолбэк на title/content).
 */
@Component({
    selector: 'app-page-view',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (loading()) {
            <div class="py-16 text-center text-text-secondary" style="font: var(--type-product)">
                {{ ph('loading') }}
            </div>
        } @else if (notFound() || !page()) {
            <div
                class="py-16 text-center text-text-secondary"
                style="font: var(--type-product)"
                data-testid="page-not-found"
            >
                {{ ph('notFound') }}
            </div>
        } @else {
            <article class="flex flex-col gap-6">
                <h1 class="text-text-primary" style="font: var(--type-hero)">{{ heading() }}</h1>
                <div
                    class="max-w-content whitespace-pre-line text-text-secondary"
                    style="font: var(--type-product)"
                    data-testid="page-content"
                    [innerHTML]="body()"
                ></div>
            </article>
        }
    `,
})
export class PageViewComponent {
    private readonly api = inject(PagesApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly i18n = inject(LanguageService);
    private readonly seo = inject(SeoService);

    protected readonly lang = this.i18n.lang;

    protected readonly loading = signal(true);
    protected readonly notFound = signal(false);
    protected readonly page = signal<CmsPage | undefined>(undefined);

    constructor() {
        // Перезагрузка при смене slug в маршруте.
        this.route.paramMap.subscribe((params) => {
            const slug = params.get('slug');
            if (slug) {
                this.load(slug);
            }
        });

        // SEO — из seoTitle/seoDescription с фолбэком на title/content.
        effect(() => {
            const p = this.page();
            if (!p) {
                return;
            }
            const lang = this.lang();
            const title = p.seoTitle?.[lang] || p.title[lang];
            const description = p.seoDescription?.[lang] || this.plain(p.content[lang]);
            this.seo.set({ title, description, type: 'article' });
        });
    }

    private load(slug: string): void {
        this.loading.set(true);
        this.notFound.set(false);
        this.api.getBySlug(slug).subscribe({
            next: (p) => {
                this.page.set(p);
                this.loading.set(false);
            },
            error: () => {
                this.page.set(undefined);
                this.notFound.set(true);
                this.loading.set(false);
            },
        });
    }

    protected readonly heading = computed(() => {
        const p = this.page();
        return p ? p.title[this.lang()] : '';
    });

    protected readonly body = computed(() => {
        const p = this.page();
        return p ? p.content[this.lang()] : '';
    });

    /** Срезает теги и сжимает пробелы — для meta description. */
    private plain(value: string): string {
        return value
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 200);
    }

    protected ph(key: string): string {
        const full = `pages.${key}`;
        const translated = this.i18n.t(full);
        if (translated !== full) {
            return translated;
        }
        return DEFAULTS[key] ?? key;
    }
}

const DEFAULTS: Record<string, string> = {
    loading: 'Loading…',
    notFound: 'Page not found',
};
