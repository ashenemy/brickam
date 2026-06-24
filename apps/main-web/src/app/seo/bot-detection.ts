/**
 * Список фрагментов User-Agent поисковых ботов и краулеров соц-сетей.
 * Сопоставление регистронезависимое (см. isBot).
 */
const BOT_UA_FRAGMENTS: readonly string[] = [
    'googlebot',
    'bingbot',
    'yandex',
    'duckduckbot',
    'baiduspider',
    'facebookexternalhit',
    'twitterbot',
    'slackbot',
    'telegrambot',
    'whatsapp',
    'applebot',
    'linkedinbot',
    'pinterest',
    'redditbot',
    'discordbot',
    'embedly',
    'quora link preview',
    'showyoubot',
    'outbrain',
    'vkshare',
    'w3c_validator',
    'petalbot',
    'semrushbot',
    'ahrefsbot',
    'mj12bot',
    'dotbot',
    'crawler',
    'spider',
    'bot/',
];

/**
 * Определяет, принадлежит ли User-Agent поисковому боту или краулеру соц-сети.
 * Чистая функция: возвращает false для пустого/неизвестного UA.
 */
export function isBot(userAgent: string | undefined | null): boolean {
    if (!userAgent) {
        return false;
    }
    const ua = userAgent.toLowerCase();
    return BOT_UA_FRAGMENTS.some((fragment) => ua.includes(fragment));
}
