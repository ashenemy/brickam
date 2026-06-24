import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideRole, provideRuntimeConfig } from '@brickam/config-kit/browser';
import { appRoutes } from './app.routes';
import { authInterceptor } from './auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        provideClientHydration(withEventReplay()),
        provideBrowserGlobalErrorListeners(),
        provideRouter(appRoutes),
        // HttpClient на fetch — совместим с SSR/гидрацией (TransferState).
        // authInterceptor добавляет Bearer-токен к запросам wishlist/cart.
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
        // Рантайм-конфиг из assets/config.json (APP_INITIALIZER, без вшитых URL/ключей)
        ...provideRuntimeConfig(),
        // Гейт входа по роли (main-web = покупатель). До Stage 2-auth роль — DEV-значение.
        provideRole('buyer'),
    ],
};
