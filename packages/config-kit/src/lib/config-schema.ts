import { z } from 'zod';

/** Строка TTL вида "15m" / "30d" / "300s". */
const ttl = z.string().regex(/^\d+[smhdw]$/, 'ожидается TTL вида 15m/30d');

/**
 * Схема валидации итогового конфига (TOML + env overlay).
 * Источник истины типов: AppConfig = z.infer<typeof configSchema>.
 * Любое отсутствующее обязательное поле валит старт приложения (fail-fast).
 */
export const configSchema = z.object({
    env: z.object({
        nodeEnv: z.enum(['development', 'production', 'test']),
    }),
    server: z.object({
        port: z.number().int().positive(),
        globalPrefix: z.string().min(1),
        corsOrigins: z.array(z.string()),
        requestTimeoutMs: z.number().int().positive(),
    }),
    auth: z.object({
        otp: z.object({
            length: z.number().int().min(4).max(10),
            ttlSeconds: z.number().int().positive(),
            maxAttempts: z.number().int().positive(),
            resendCooldownSeconds: z.number().int().nonnegative(),
        }),
        jwt: z.object({
            accessTtl: ttl,
            refreshTtl: ttl,
            accessSecret: z.string().min(1, 'JWT_ACCESS_SECRET обязателен'),
            refreshSecret: z.string().min(1, 'JWT_REFRESH_SECRET обязателен'),
        }),
    }),
    pagination: z.object({
        defaultPageSize: z.number().int().positive(),
        maxPageSize: z.number().int().positive(),
    }),
    marketplace: z.object({
        baseCurrency: z.string().length(3),
        displayCurrencies: z.array(z.string().length(3)).min(1),
        commissionPercent: z.number().min(0).max(100),
    }),
    providers: z.object({
        sms: z.string().min(1),
        llm: z.string().min(1),
        embeddings: z.string().min(1),
        image: z.string().min(1),
        video: z.string().min(1),
        storage: z.string().min(1),
        payment: z.string().min(1),
        exchangeRates: z.string().min(1),
    }),
    features: z.object({
        aiSearch: z.boolean(),
        videoCover: z.boolean(),
        wishlist: z.boolean(),
        loyalty: z.boolean(),
        botOnlySsr: z.boolean(),
    }),
    queue: z.object({
        redisUrl: z.string().min(1, 'REDIS_URL обязателен'),
    }),
    database: z.object({
        mongoUri: z.string().min(1, 'MONGO_URI обязателен'),
    }),
    secrets: z.object({
        sentryDsn: z.string().optional(),
        anthropicApiKey: z.string().optional(),
        voyageApiKey: z.string().optional(),
        falApiKey: z.string().optional(),
        twilioAccountSid: z.string().optional(),
        twilioAuthToken: z.string().optional(),
        twilioFrom: z.string().optional(),
        s3Endpoint: z.string().optional(),
        s3Region: z.string().optional(),
        s3Bucket: z.string().optional(),
        s3AccessKeyId: z.string().optional(),
        s3SecretAccessKey: z.string().optional(),
        s3PublicUrl: z.string().optional(),
        paymentApiKey: z.string().optional(),
        paymentMerchantId: z.string().optional(),
        exchangeRatesApiKey: z.string().optional(),
    }),
});

export type AppConfig = z.infer<typeof configSchema>;
export type ConfigNamespace = keyof AppConfig;
