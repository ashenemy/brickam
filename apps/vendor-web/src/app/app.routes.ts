import { Route } from '@angular/router';
import { AiAssistantPageComponent } from './ai-assistant/ai-assistant-page.component';
import { AnalyticsComponent } from './analytics/analytics.component';
import { LoginPageComponent } from './auth/login-page.component';
import { RegisterPageComponent } from './auth/register-page.component';
import { roleGuard } from './auth/role.guard';
import { BulkComponent } from './bulk/bulk.component';
import { ForbiddenComponent } from './forbidden.component';
import { HomeComponent } from './home.component';
import { InvoiceCreateComponent } from './invoices/invoice-create.component';
import { MembersComponent } from './members/members.component';
import { OrdersComponent } from './orders/orders.component';
import { ProductsComponent } from './products/products.component';
import { SubscriptionComponent } from './subscription/subscription.component';

// Все кабинетные маршруты приватны. roleGuard сам редиректит на /login,
// если не вошёл, и на /forbidden, если роль не продавец.
const vendor = [roleGuard(['vendor_owner', 'vendor_member'])];

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
