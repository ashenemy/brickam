import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
    // Статические страницы — пререндер на билде.
    { path: '', renderMode: RenderMode.Prerender },
    { path: 'forbidden', renderMode: RenderMode.Prerender },
    // Каталог и товары — SSR on-demand (список товаров неизвестен на билде).
    { path: 'catalog', renderMode: RenderMode.Server },
    { path: 'product/:slug', renderMode: RenderMode.Server },
    // Остальное (включая :slug-параметры) — SSR, не пререндер.
    { path: '**', renderMode: RenderMode.Server },
];
