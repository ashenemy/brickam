import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
    // Статические страницы — пререндер на билде.
    { path: '', renderMode: RenderMode.Prerender },
    { path: 'forbidden', renderMode: RenderMode.Prerender },
    // Калькуляторы — статическая страница, данные из calc-kit; пререндер на билде.
    { path: 'calculators', renderMode: RenderMode.Prerender },
    // AI-поиск — оболочка пуста до запроса пользователя; пререндер на билде.
    { path: 'ai', renderMode: RenderMode.Prerender },
    // Вход/регистрация — формы статичны до сабмита; пререндер на билде.
    { path: 'login', renderMode: RenderMode.Prerender },
    { path: 'register', renderMode: RenderMode.Prerender },
    // Каталог и товары — SSR on-demand (список товаров неизвестен на билде).
    { path: 'catalog', renderMode: RenderMode.Server },
    { path: 'product/:slug', renderMode: RenderMode.Server },
    // Вишлист — данные требуют токена; SSR on-demand, не пререндер.
    { path: 'wishlist', renderMode: RenderMode.Server },
    // Лояльность — статус требует токена; SSR on-demand, не пререндер.
    { path: 'loyalty', renderMode: RenderMode.Server },
    // Чат — требует токена и сокета; SSR on-demand, не пререндер.
    { path: 'chat', renderMode: RenderMode.Server },
    // Корзина — данные требуют токена; SSR on-demand (у гостя пуста), не пререндер.
    { path: 'cart', renderMode: RenderMode.Server },
    // Оформление — приватное; SSR on-demand, не пререндер.
    { path: 'checkout', renderMode: RenderMode.Server },
    // Заказы — приватные, данные требуют токена; SSR on-demand, не пререндер.
    { path: 'orders', renderMode: RenderMode.Server },
    { path: 'orders/:id', renderMode: RenderMode.Server },
    // Остальное (включая :slug-параметры) — SSR, не пререндер.
    { path: '**', renderMode: RenderMode.Server },
];
