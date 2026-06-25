import { Route } from '@angular/router';
import { LoginPageComponent } from './auth/login-page.component';
import { roleGuard } from './auth/role.guard';
import { ForbiddenComponent } from './forbidden.component';
import { HomeComponent } from './home.component';

// Все маршруты админки приватны. roleGuard сам редиректит на /login,
// если не вошёл, и на /forbidden, если роль не admin.
const admin = [roleGuard(['admin'])];

export const appRoutes: Route[] = [
    { path: 'login', component: LoginPageComponent },
    { path: '', component: HomeComponent, canActivate: admin },
    {
        path: 'moderation',
        canActivate: admin,
        loadComponent: () =>
            import('./moderation/moderation.component').then((m) => m.ModerationComponent),
    },
    {
        path: 'settings',
        canActivate: admin,
        loadComponent: () =>
            import('./settings/settings.component').then((m) => m.SettingsComponent),
    },
    {
        path: 'disputes',
        canActivate: admin,
        loadComponent: () =>
            import('./disputes/disputes.component').then((m) => m.DisputesComponent),
    },
    {
        path: 'analytics',
        canActivate: admin,
        loadComponent: () =>
            import('./analytics/analytics.component').then((m) => m.AnalyticsComponent),
    },
    {
        path: 'templates',
        canActivate: admin,
        loadComponent: () =>
            import('./templates/templates.component').then((m) => m.TemplatesComponent),
    },
    {
        path: 'loyalty',
        canActivate: admin,
        loadComponent: () => import('./loyalty/loyalty.component').then((m) => m.LoyaltyComponent),
    },
    {
        path: 'audit',
        canActivate: admin,
        loadComponent: () => import('./audit/audit.component').then((m) => m.AuditComponent),
    },
    { path: 'forbidden', component: ForbiddenComponent },
    { path: '**', redirectTo: '' },
];
