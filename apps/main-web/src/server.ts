import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    AngularNodeAppEngine,
    createNodeRequestHandler,
    isMainModule,
    writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { isBot } from './app/seo/bot-detection';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/** База каталожного API для генерации sitemap (env с дефолтом на localhost). */
const API_BASE_URL = process.env['API_BASE_URL'] ?? 'http://localhost:3000/api';

/** Публичный базовый URL сайта (для абсолютных ссылок в sitemap). */
const SITE_URL = (process.env['SITE_URL'] ?? 'http://localhost:4000').replace(/\/$/, '');

/**
 * robots.txt — разрешаем всё и указываем sitemap.
 */
app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send(
        ['User-agent: *', 'Allow: /', '', `Sitemap: ${SITE_URL}/sitemap.xml`, ''].join('\n'),
    );
});

/**
 * sitemap.xml — статические URL + товарные /product/:slug. Slug'и подтягиваются
 * из каталожного API; при ошибке отдаём sitemap только со статическими URL.
 */
app.get('/sitemap.xml', async (_req, res) => {
    const urls: string[] = [`${SITE_URL}/`, `${SITE_URL}/catalog`];
    try {
        const response = await fetch(`${API_BASE_URL}/catalog/products?pageSize=100`);
        if (response.ok) {
            const body = (await response.json()) as { data?: Array<{ slug?: string }> };
            for (const item of body.data ?? []) {
                if (item.slug) {
                    urls.push(`${SITE_URL}/product/${encodeURIComponent(item.slug)}`);
                }
            }
        }
    } catch {
        // Сеть/API недоступны — оставляем только статические URL.
    }

    const body = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls.map((u) => `  <url><loc>${u}</loc></url>`),
        '</urlset>',
        '',
    ].join('\n');

    res.type('application/xml').send(body);
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/**', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
    express.static(browserDistFolder, {
        maxAge: '1y',
        index: false,
        redirect: false,
    }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
    // Dynamic rendering: и для ботов, и для людей — SSR (Angular гидрирует на клиенте).
    // Заголовок X-Render-Mode для наблюдаемости (edge-сплит SSR/CSR — на nginx).
    res.setHeader('X-Render-Mode', isBot(req.headers['user-agent']) ? 'ssr-bot' : 'ssr-hydrate');
    angularApp
        .handle(req)
        .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
        .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
    const port = process.env['PORT'] || 4000;
    app.listen(port, () => {
        console.log(`Node Express server listening on http://localhost:${port}`);
    });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
