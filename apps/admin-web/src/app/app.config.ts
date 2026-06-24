import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideRole, provideRuntimeConfig } from '@brickam/config-kit/browser';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideRouter(appRoutes),
        ...provideRuntimeConfig(),
        // Гейт входа по роли (admin-web = администратор).
        provideRole('admin'),
    ],
};
