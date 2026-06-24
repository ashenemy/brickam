import { isBot } from './bot-detection';

describe('isBot (детект ботов по User-Agent)', () => {
    const bots = [
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
        'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)',
        'DuckDuckBot/1.1; (+http://duckduckgo.com/duckduckbot.html)',
        'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)',
        'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Twitterbot/1.0',
        'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
        'TelegramBot (like TwitterBot)',
        'WhatsApp/2.21',
        'Mozilla/5.0 (Macintosh) AppleBot/0.1',
    ];

    const humans = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    ];

    it('распознаёт бот-UA как бота (case-insensitive)', () => {
        for (const ua of bots) {
            expect(isBot(ua)).toBe(true);
            expect(isBot(ua.toUpperCase())).toBe(true);
        }
    });

    it('обычные браузеры (Chrome/Firefox/Safari) — не боты', () => {
        for (const ua of humans) {
            expect(isBot(ua)).toBe(false);
        }
    });

    it('пустой/неопределённый UA — не бот', () => {
        expect(isBot(undefined)).toBe(false);
        expect(isBot(null)).toBe(false);
        expect(isBot('')).toBe(false);
    });
});
