import { Route } from '@angular/router';
import { roleGuard } from '@brickam/config-kit/browser';
import { ForbiddenComponent } from './forbidden.component';
import { HomeComponent } from './home.component';

export const appRoutes: Route[] = [
    { path: '', component: HomeComponent, canActivate: [roleGuard(['buyer'])] },
    { path: 'forbidden', component: ForbiddenComponent },
    { path: '**', redirectTo: '' },
];
