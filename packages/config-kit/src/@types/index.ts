export type { AppConfig, ConfigNamespace } from '../lib/config-schema';

/** Опции загрузчика конфига (тестируемость: можно подменить env и каталог). */
export type LoadConfigOptions = {
    /** Каталог с *.toml. По умолчанию: env CONFIG_DIR или <cwd>/config. */
    configDir?: string;
    /** Источник переменных окружения. По умолчанию process.env. */
    env?: NodeJS.ProcessEnv;
    /** Явное значение NODE_ENV (иначе берётся из env). */
    nodeEnv?: string;
};

/** Токен внедрения валидированного AppConfig. */
export const APP_CONFIG = Symbol('APP_CONFIG');
