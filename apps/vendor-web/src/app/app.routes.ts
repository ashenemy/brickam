import { Route } from '@angular/router';
import { roleGuard } from '@brickam/config-kit/browser';
import { ForbiddenComponent } from './forbidden.component';
import { HomeComponent } from './home.component';
import { InvoiceCreateComponent } from './invoices/invoice-create.component';

export const appRoutes: Route[] = [
    { path: '', component: HomeComponent, canActivate: [roleGuard(['vendor'])] },
    {
        path: 'invoices/new',
        component: InvoiceCreateComponent,
        canActivate: [roleGuard(['vendor'])],
    },
    { path: 'forbidden', component: ForbiddenComponent },
    { path: '**', redirectTo: '' },
];
