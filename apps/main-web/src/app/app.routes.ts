import { Route } from '@angular/router';
import { roleGuard } from '@brickam/config-kit/browser';
import { CatalogListComponent } from './catalog/catalog-list.component';
import { ProductDetailComponent } from './catalog/product-detail.component';
import { ForbiddenComponent } from './forbidden.component';
import { HomeComponent } from './home.component';

export const appRoutes: Route[] = [
    { path: '', component: HomeComponent, canActivate: [roleGuard(['buyer'])] },
    { path: 'catalog', component: CatalogListComponent, canActivate: [roleGuard(['buyer'])] },
    {
        path: 'product/:slug',
        component: ProductDetailComponent,
        canActivate: [roleGuard(['buyer'])],
    },
    { path: 'forbidden', component: ForbiddenComponent },
    { path: '**', redirectTo: '' },
];
