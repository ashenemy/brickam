import { Route } from '@angular/router';
import { roleGuard } from '@brickam/config-kit/browser';
import { AiAssistantPageComponent } from './ai-assistant/ai-assistant-page.component';
import { AnalyticsComponent } from './analytics/analytics.component';
import { authGuard } from './auth/auth.guard';
import { LoginPageComponent } from './auth/login-page.component';
import { RegisterPageComponent } from './auth/register-page.component';
import { BulkComponent } from './bulk/bulk.component';
import { ForbiddenComponent } from './forbidden.component';
import { HomeComponent } from './home.component';
import { InvoiceCreateComponent } from './invoices/invoice-create.component';
import { MembersComponent } from './members/members.component';
import { OrdersComponent } from './orders/orders.component';
import { ProductsComponent } from './products/products.component';
import { SubscriptionComponent } from './subscription/subscription.component';

const vendor = [authGuard, roleGuard(['vendor'])];

export const appRoutes: Route[] = [
    { path: 'login', component: LoginPageComponent },
    { path: 'register', component: RegisterPageComponent },
    { path: '', component: HomeComponent, canActivate: vendor },
    { path: 'products', component: ProductsComponent, canActivate: vendor },
    { path: 'bulk', component: BulkComponent, canActivate: vendor },
    { path: 'orders', component: OrdersComponent, canActivate: vendor },
    { path: 'members', component: MembersComponent, canActivate: vendor },
    { path: 'analytics', component: AnalyticsComponent, canActivate: vendor },
    { path: 'subscription', component: SubscriptionComponent, canActivate: vendor },
    { path: 'ai-assistant', component: AiAssistantPageComponent, canActivate: vendor },
    { path: 'invoices/new', component: InvoiceCreateComponent, canActivate: vendor },
    { path: 'forbidden', component: ForbiddenComponent },
    { path: '**', redirectTo: '' },
];
