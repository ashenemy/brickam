import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
    // Статические страницы — пререндер на билде.
    { path: '', renderMode: RenderMode.Prerender },
    { path: 'forbidden', renderMode: RenderMode.Prerender },
    // Калькуляторы — статическая страница, данные из calc-kit; пререндер на билде.
    { path: 'calculators', renderMode: RenderMode.Prerender },
    // AI-поиск — оболочка пуста до запроса пользователя; пререндер на билде.
    { path: 'ai', renderMode: RenderMode.Prerender },
    // Каталог и товары — SSR on-demand (список товаров неизвестен на билде).
    { path: 'catalog', renderMode: RenderMode.Server },
    { path: 'product/:slug', renderMode: RenderMode.Server },
    // Вишлист — данные требуют токена; SSR on-demand, не пререндер.
    { path: 'wishlist', renderMode: RenderMode.Server },
    // Лояльность — статус требует токена; SSR on-demand, не пререндер.
    { path: 'loyalty', renderMode: RenderMode.Server },
    // Чат — требует токена и сокета; SSR on-demand, не пререндер.
    { path: 'chat', renderMode: RenderMode.Server },
    // Остальное (включая :slug-параметры) — SSR, не пререндер.
    { path: '**', renderMode: RenderMode.Server },
];
