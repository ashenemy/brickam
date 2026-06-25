import { Route } from '@angular/router';
import { roleGuard } from '@brickam/config-kit/browser';
import { CalculatorsPageComponent } from './calculators/calculators-page.component';
import { CatalogListComponent } from './catalog/catalog-list.component';
import { ProductDetailComponent } from './catalog/product-detail.component';
import { ChatPageComponent } from './chat/chat-page.component';
import { ForbiddenComponent } from './forbidden.component';
import { HomeComponent } from './home.component';
import { LoyaltyPageComponent } from './loyalty/loyalty-page.component';
import { WishlistPageComponent } from './wishlist/wishlist-page.component';

export const appRoutes: Route[] = [
    { path: '', component: HomeComponent, canActivate: [roleGuard(['buyer'])] },
    { path: 'catalog', component: CatalogListComponent, canActivate: [roleGuard(['buyer'])] },
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
    { path: 'wishlist', component: WishlistPageComponent, canActivate: [roleGuard(['buyer'])] },
    { path: 'loyalty', component: LoyaltyPageComponent, canActivate: [roleGuard(['buyer'])] },
    { path: 'chat', component: ChatPageComponent, canActivate: [roleGuard(['buyer'])] },
    { path: 'forbidden', component: ForbiddenComponent },
    { path: '**', redirectTo: '' },
];
