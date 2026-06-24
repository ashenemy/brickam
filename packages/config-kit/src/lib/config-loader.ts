import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseToml } from 'smol-toml';
import type { LoadConfigOptions } from '../@types';
import { type AppConfig, configSchema } from './config-schema';
import { deepMerge } from './deep-merge';

const readToml = (file: string): Record<string, unknown> => {
    if (!existsSync(file)) {
        return {};
    }
    return parseToml(readFileSync(file, 'utf8')) as Record<string, unknown>;
};

const ENV_PLACEHOLDER = /^env:(.+)$/;

/** Заменяет строковые плейсхолдеры вида "env:VAR" значениями из окружения. */
const resolvePlaceholders = (value: unknown, env: NodeJS.ProcessEnv): unknown => {
    if (typeof value === 'string') {
        const match = ENV_PLACEHOLDER.exec(value);
        return match ? (env[match[1]] ?? '') : value;
    }
    if (Array.isArray(value)) {
        return value.map((item) => resolvePlaceholders(item, env));
    }
    if (value !== null && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, item]) => [
                key,
                resolvePlaceholders(item, env),
            ]),
        );
    }
    return value;
};

/** Ошибка валидации конфига на старте (fail-fast). */
export class ConfigValidationError extends Error {
    constructor(readonly issues: string[]) {
        super(`Конфиг невалиден (fail-fast):\n  - ${issues.join('\n  - ')}`);
        this.name = 'ConfigValidationError';
    }
}

/**
 * Загружает и валидирует конфиг:
 * config/default.toml ⊕ config/{NODE_ENV}.toml (deep-merge) ⊕ overlay из env,
 * затем zod-валидация. Любое нарушение → ConfigValidationError (падение старта).
 */
export const loadConfig = (options: LoadConfigOptions = {}): AppConfig => {
    const env = options.env ?? process.env;
    const nodeEnv = options.nodeEnv ?? env['NODE_ENV'] ?? 'development';
    const configDir = options.configDir ?? env['CONFIG_DIR'] ?? resolve(process.cwd(), 'config');

    const base = readToml(resolve(configDir, 'default.toml'));
    const overlay = readToml(resolve(configDir, `${nodeEnv}.toml`));
    const mergedToml = deepMerge(base, overlay);
    const resolved = resolvePlaceholders(mergedToml, env) as Record<string, any>;

    // Секреты и обязательные подключения берутся ТОЛЬКО из env — в TOML их нет.
    const candidate: Record<string, unknown> = {
        ...resolved,
        env: { nodeEnv },
        auth: {
            ...resolved['auth'],
            jwt: {
                ...resolved['auth']?.['jwt'],
                accessSecret: env['JWT_ACCESS_SECRET'] ?? '',
                refreshSecret: env['JWT_REFRESH_SECRET'] ?? '',
            },
        },
        database: { mongoUri: env['MONGO_URI'] ?? '' },
        secrets: {
            sentryDsn: env['SENTRY_DSN'] || undefined,
            anthropicApiKey: env['ANTHROPIC_API_KEY'] || undefined,
            voyageApiKey: env['VOYAGE_API_KEY'] || undefined,
            falApiKey: env['FAL_API_KEY'] || undefined,
            twilioAccountSid: env['TWILIO_ACCOUNT_SID'] || undefined,
            twilioAuthToken: env['TWILIO_AUTH_TOKEN'] || undefined,
            twilioFrom: env['TWILIO_FROM'] || undefined,
            s3Endpoint: env['S3_ENDPOINT'] || undefined,
            s3Region: env['S3_REGION'] || undefined,
            s3Bucket: env['S3_BUCKET'] || undefined,
            s3AccessKeyId: env['S3_ACCESS_KEY_ID'] || undefined,
            s3SecretAccessKey: env['S3_SECRET_ACCESS_KEY'] || undefined,
            s3PublicUrl: env['S3_PUBLIC_URL'] || undefined,
            paymentApiKey: env['PAYMENT_API_KEY'] || undefined,
            paymentMerchantId: env['PAYMENT_MERCHANT_ID'] || undefined,
            exchangeRatesApiKey: env['EXCHANGE_RATES_API_KEY'] || undefined,
        },
    };

    const parsed = configSchema.safeParse(candidate);
    if (!parsed.success) {
        const issues = parsed.error.issues.map(
            (issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`,
        );
        throw new ConfigValidationError(issues);
    }
    return parsed.data;
};
