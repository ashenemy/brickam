import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideRuntimeConfig } from '@brickam/config-kit/browser';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
    providers: [
        provideClientHydration(withEventReplay()),
        provideBrowserGlobalErrorListeners(),
        provideRouter(appRoutes),
        // Рантайм-конфиг из assets/config.json (APP_INITIALIZER, без вшитых URL/ключей)
        ...provideRuntimeConfig(),
    ],
};
