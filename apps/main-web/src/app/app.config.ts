import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideRuntimeConfig } from '@brickam/config-kit/browser';
import { appRoutes } from './app.routes';
import { authInterceptor } from './auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        provideClientHydration(withEventReplay()),
        provideBrowserGlobalErrorListeners(),
        // Angular Material: SSR-совместимые анимации + дефолтный fontSet иконок
        // (Material Symbols Outlined — тонкие line-иконки, см. material-theme.scss).
        provideAnimationsAsync(),
        { provide: MAT_ICON_DEFAULT_OPTIONS, useValue: { fontSet: 'material-symbols-outlined' } },
        provideRouter(appRoutes),
        // HttpClient на fetch — совместим с SSR/гидрацией (TransferState).
        // authInterceptor добавляет Bearer-токен к запросам wishlist/cart.
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
        // Рантайм-конфиг из assets/config.json (APP_INITIALIZER, без вшитых URL/ключей)
        ...provideRuntimeConfig(),
        // Роль больше не задаётся статически: источник истины — SessionStore
        // (GET /auth/me), roleGuard гейтит маршруты по реальной роли.
    ],
};
