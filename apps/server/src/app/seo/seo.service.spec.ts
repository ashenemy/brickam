import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadSeoConfig, type SeoConfig } from './seo.config';
import { escapeXml, SeoService } from './seo.service';

const config: SeoConfig = { baseUrl: 'https://brickam.am', globalPrefix: 'api' };

describe('escapeXml', () => {
    it('экранирует все пять XML-сущностей и не задваивает амперсанд', () => {
        expect(escapeXml(`a&b<c>d"e'f`)).toBe('a&amp;b&lt;c&gt;d&quot;e&apos;f');
        // Амперсанд обрабатывается первым: '<' внутри не превращает '&' в '&amp;amp;'.
        expect(escapeXml('x & <y>')).toBe('x &amp; &lt;y&gt;');
    });
});

describe('loadSeoConfig', () => {
    it('берёт SITE_URL из env и срезает завершающий слэш', () => {
        const cfg = loadSeoConfig({ SITE_URL: 'https://site.example/' }, '/api/');
        expect(cfg.baseUrl).toBe('https://site.example');
        expect(cfg.globalPrefix).toBe('api');
    });

    it('использует дефолтный URL без env SITE_URL', () => {
        const cfg = loadSeoConfig({}, 'api');
        expect(cfg.baseUrl).toBe('http://localhost:4200');
    });
});

describe('SeoService', () => {
    let pages: { listPublished: ReturnType<typeof vi.fn> };
    let products: { search: ReturnType<typeof vi.fn> };
    let service: SeoService;

    beforeEach(() => {
        pages = {
            listPublished: vi.fn(async () => [
                { slug: 'about' },
                { slug: 'terms' },
                { slug: 'privacy' },
            ]),
        };
        products = {
            search: vi.fn(async () => ({
                data: [{ slug: 'cement-m500-pro' }, { slug: 'tile & stone' }],
                meta: {},
            })),
        };
        service = new SeoService(config, pages as never, products as never);
    });

    it('collectUrls собирает статику + страницы + товары как абсолютные URL', async () => {
        const urls = await service.collectUrls();
        expect(urls).toEqual([
            'https://brickam.am/',
            'https://brickam.am/catalog',
            'https://brickam.am/pages/about',
            'https://brickam.am/pages/terms',
            'https://brickam.am/pages/privacy',
            'https://brickam.am/product/cement-m500-pro',
            'https://brickam.am/product/tile & stone',
        ]);
    });

    it('generateSitemap отдаёт валидный XML с loc для каждого URL', async () => {
        const xml = await service.generateSitemap();
        expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
        expect(xml).toContain('</urlset>');
        expect(xml).toContain('<loc>https://brickam.am/</loc>');
        expect(xml).toContain('<loc>https://brickam.am/pages/privacy</loc>');
        expect(xml).toContain('<loc>https://brickam.am/product/cement-m500-pro</loc>');
        // 2 статики + 3 страницы + 2 товара = 7 <url>.
        expect(xml.match(/<url>/g)).toHaveLength(7);
        // lastmod опущен (детерминированность).
        expect(xml).not.toContain('<lastmod>');
    });

    it('экранирует спецсимволы slug в <loc>', async () => {
        const xml = await service.generateSitemap();
        expect(xml).toContain('<loc>https://brickam.am/product/tile &amp; stone</loc>');
        expect(xml).not.toContain('product/tile & stone</loc>');
    });

    it('ограничивает число товаров в карте (MAX_PRODUCT_URLS)', async () => {
        const many = Array.from({ length: 1500 }, (_, i) => ({ slug: `p-${i}` }));
        products.search.mockResolvedValueOnce({ data: many, meta: {} });
        const urls = await service.collectUrls();
        const productUrls = urls.filter((u) => u.includes('/product/'));
        expect(productUrls).toHaveLength(1000);
        // Запрошена первая страница с разумным лимитом.
        expect(products.search).toHaveBeenCalledWith({ page: 1, pageSize: 1000 });
    });

    it('generateRobots содержит Sitemap с абсолютным URL карты', () => {
        const robots = service.generateRobots();
        expect(robots).toContain('User-agent: *');
        expect(robots).toContain('Allow: /');
        expect(robots).toContain('Sitemap: https://brickam.am/api/sitemap.xml');
        expect(service.sitemapUrl).toBe('https://brickam.am/api/sitemap.xml');
    });
});
