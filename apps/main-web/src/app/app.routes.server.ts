import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
    // Главная — SSR on-demand: «Best deals» рендерятся сервером из живого каталога.
    { path: '', renderMode: RenderMode.Server },
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
    // CMS-страницы — контент динамический (с бэкенда); SSR on-demand, не пререндер.
    { path: 'p/:slug', renderMode: RenderMode.Server },
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
    // Профиль — приватный, данные требуют токена; SSR on-demand.
    { path: 'profile', renderMode: RenderMode.Server },
    // Остальное (включая :slug-параметры) — SSR, не пререндер.
    { path: '**', renderMode: RenderMode.Server },
];
