// Серверный (Node/Nest) публичный API config-kit.
// Браузерный рантайм-провайдер для Angular — в отдельном входе '@brickam/config-kit/browser'
// (чтобы node-код никогда не попадал в фронтовый бандл).
export * from './@types';
export * from './lib/app-config.service';
export * from './lib/config-kit.module';
export * from './lib/config-loader';
export * from './lib/config-schema';
export * from './lib/deep-merge';
