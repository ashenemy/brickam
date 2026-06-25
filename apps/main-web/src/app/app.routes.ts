import { Route } from '@angular/router';
import { AiSearchPageComponent } from './ai-search/ai-search-page.component';
import { LoginPageComponent } from './auth/login-page.component';
import { RegisterPageComponent } from './auth/register-page.component';
import { roleGuard } from './auth/role.guard';
import { CalculatorsPageComponent } from './calculators/calculators-page.component';
import { CartPageComponent } from './cart/cart-page.component';
import { CatalogListComponent } from './catalog/catalog-list.component';
import { ProductDetailComponent } from './catalog/product-detail.component';
import { CheckoutPageComponent } from './checkout/checkout-page.component';
import { ForbiddenComponent } from './forbidden.component';
import { HomeComponent } from './home.component';
import { LoyaltyPageComponent } from './loyalty/loyalty-page.component';
import { OrderDetailComponent } from './orders/order-detail.component';
import { OrderHistoryComponent } from './orders/order-history.component';
import { WishlistPageComponent } from './wishlist/wishlist-page.component';

// Приватные маршруты покупателя: roleGuard сам редиректит на /login,
// если не вошёл, и на /forbidden, если роль не buyer.
const buyer = [roleGuard(['buyer'])];

export const appRoutes: Route[] = [
    // Публичные витрины — доступны гостю, без гейта роли.
    { path: '', component: HomeComponent },
    { path: 'catalog', component: CatalogListComponent },
    { path: 'ai', component: AiSearchPageComponent },
    { path: 'calculators', component: CalculatorsPageComponent },
    { path: 'product/:slug', component: ProductDetailComponent },
    // CMS-страницы (about/terms/privacy) — публичные, контент с бэкенда.
    {
        path: 'p/:slug',
        loadComponent: () => import('./pages/page-view.component').then((m) => m.PageViewComponent),
    },
    // Корзина доступна без логина (у гостя пуста); оформление потребует авторизации.
    { path: 'cart', component: CartPageComponent },
    // Приватные разделы покупателя.
    { path: 'wishlist', component: WishlistPageComponent, canActivate: buyer },
    { path: 'loyalty', component: LoyaltyPageComponent, canActivate: buyer },
    // Чат тянет socket.io-client — выносим в отдельный lazy-чанк.
    {
        path: 'chat',
        loadComponent: () => import('./chat/chat-page.component').then((m) => m.ChatPageComponent),
        canActivate: buyer,
    },
    { path: 'checkout', component: CheckoutPageComponent, canActivate: buyer },
    { path: 'orders', component: OrderHistoryComponent, canActivate: buyer },
    { path: 'orders/:id', component: OrderDetailComponent, canActivate: buyer },
    { path: 'login', component: LoginPageComponent },
    { path: 'register', component: RegisterPageComponent },
    { path: 'forbidden', component: ForbiddenComponent },
    { path: '**', redirectTo: '' },
];
