import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideRole, provideRuntimeConfig } from '@brickam/config-kit/browser';
import { appRoutes } from './app.routes';
import { authInterceptor } from './auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideRouter(appRoutes),
        // HttpClient на fetch; authInterceptor добавляет Bearer-токен из TokenStore.
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
        ...provideRuntimeConfig(),
        // Гейт входа по роли (vendor-web = продавец).
        provideRole('vendor'),
    ],
};
