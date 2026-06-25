import { Route } from '@angular/router';
import { roleGuard } from '@brickam/config-kit/browser';
import { AiSearchPageComponent } from './ai-search/ai-search-page.component';
import { authGuard } from './auth/auth.guard';
import { LoginPageComponent } from './auth/login-page.component';
import { RegisterPageComponent } from './auth/register-page.component';
import { CalculatorsPageComponent } from './calculators/calculators-page.component';
import { CartPageComponent } from './cart/cart-page.component';
import { CatalogListComponent } from './catalog/catalog-list.component';
import { ProductDetailComponent } from './catalog/product-detail.component';
import { ChatPageComponent } from './chat/chat-page.component';
import { CheckoutPageComponent } from './checkout/checkout-page.component';
import { ForbiddenComponent } from './forbidden.component';
import { HomeComponent } from './home.component';
import { LoyaltyPageComponent } from './loyalty/loyalty-page.component';
import { OrderDetailComponent } from './orders/order-detail.component';
import { OrderHistoryComponent } from './orders/order-history.component';
import { WishlistPageComponent } from './wishlist/wishlist-page.component';

export const appRoutes: Route[] = [
    { path: '', component: HomeComponent, canActivate: [roleGuard(['buyer'])] },
    { path: 'catalog', component: CatalogListComponent, canActivate: [roleGuard(['buyer'])] },
    { path: 'ai', component: AiSearchPageComponent, canActivate: [roleGuard(['buyer'])] },
    {
        path: 'calculators',
        component: CalculatorsPageComponent,
        canActivate: [roleGuard(['buyer'])],
    },
    {
        path: 'product/:slug',
        component: ProductDetailComponent,
        canActivate: [roleGuard(['buyer'])],
    },
    {
        path: 'wishlist',
        component: WishlistPageComponent,
        canActivate: [authGuard, roleGuard(['buyer'])],
    },
    {
        path: 'loyalty',
        component: LoyaltyPageComponent,
        canActivate: [authGuard, roleGuard(['buyer'])],
    },
    { path: 'chat', component: ChatPageComponent, canActivate: [authGuard, roleGuard(['buyer'])] },
    // Корзина доступна без логина (у гостя пуста); оформление потребует авторизации.
    { path: 'cart', component: CartPageComponent, canActivate: [roleGuard(['buyer'])] },
    {
        path: 'checkout',
        component: CheckoutPageComponent,
        canActivate: [authGuard, roleGuard(['buyer'])],
    },
    {
        path: 'orders',
        component: OrderHistoryComponent,
        canActivate: [authGuard, roleGuard(['buyer'])],
    },
    {
        path: 'orders/:id',
        component: OrderDetailComponent,
        canActivate: [authGuard, roleGuard(['buyer'])],
    },
    { path: 'login', component: LoginPageComponent },
    { path: 'register', component: RegisterPageComponent },
    { path: 'forbidden', component: ForbiddenComponent },
    { path: '**', redirectTo: '' },
];
