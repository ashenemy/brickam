import { ProductsService } from '@brickam/catalog';
import { PagesService } from '@brickam/pages';
import { Inject, Injectable } from '@nestjs/common';
import { SEO_CONFIG, type SeoConfig } from './seo.config';

/** Максимум товаров в карте (разумный предел против раздувания sitemap). */
const MAX_PRODUCT_URLS = 1000;

/** Статические публичные маршруты фронтенда, всегда присутствующие в карте. */
const STATIC_PATHS: readonly string[] = ['/', '/catalog'];

/**
 * Экранирует пять XML-предопределённых сущностей в значении `<loc>` (амперсанд —
 * первым, чтобы не задвоить уже экранированные). Без этого slug со спецсимволом
 * сломал бы XML.
 */
export const escapeXml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

/**
 * Сервис генерации SEO-артефактов (sitemap.xml + robots.txt). Чистая логика
 * без побочных эффектов и без Date.now (детерминированно): собирает абсолютные
 * URL из статических маршрутов, опубликованных CMS-страниц (`PagesService`) и
 * опубликованных товаров каталога (`ProductsService`), затем сериализует в XML.
 */
@Injectable()
export class SeoService {
    constructor(
        @Inject(SEO_CONFIG) private readonly config: SeoConfig,
        private readonly pages: PagesService,
        private readonly products: ProductsService,
    ) {}

    /** Абсолютный URL карты сайта (с учётом globalPrefix). */
    get sitemapUrl(): string {
        return this.absolute(`/${this.config.globalPrefix}/sitemap.xml`);
    }

    /** Префиксует относительный путь базовым URL сайта (без двойных слэшей). */
    private absolute(path: string): string {
        const normalized = path.startsWith('/') ? path : `/${path}`;
        return `${this.config.baseUrl}${normalized}`;
    }

    /**
     * Собирает упорядоченный список абсолютных URL карты: статика → страницы →
     * товары. Slug'и страниц/товаров приводятся к `/pages/<slug>` и
     * `/product/<slug>`. Список товаров ограничен `MAX_PRODUCT_URLS`.
     */
    async collectUrls(): Promise<string[]> {
        const urls: string[] = STATIC_PATHS.map((path) => this.absolute(path));

        const pages = await this.pages.listPublished();
        for (const page of pages) {
            urls.push(this.absolute(`/pages/${page.slug}`));
        }

        const result = await this.products.search({ page: 1, pageSize: MAX_PRODUCT_URLS } as never);
        for (const product of result.data.slice(0, MAX_PRODUCT_URLS)) {
            urls.push(this.absolute(`/product/${product.slug}`));
        }

        return urls;
    }

    /**
     * Генерирует строку sitemap.xml по протоколу sitemaps.org. `lastmod`
     * сознательно опущен (детерминированность — без текущего времени). Каждый
     * URL экранируется.
     */
    async generateSitemap(): Promise<string> {
        const urls = await this.collectUrls();
        const body = urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n');
        return [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
            body,
            '</urlset>',
            '',
        ].join('\n');
    }

    /**
     * Генерирует robots.txt: открывает весь сайт для всех ботов и указывает на
     * абсолютный URL карты сайта.
     */
    generateRobots(): string {
        return ['User-agent: *', 'Allow: /', `Sitemap: ${this.sitemapUrl}`, ''].join('\n');
    }
}
