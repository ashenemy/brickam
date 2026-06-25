import { describe, expect, it } from 'vitest';
import { FallbackRatesProvider } from './fallback-rates.provider';

describe('FallbackRatesProvider', () => {
    it('имеет имя fallback', () => {
        expect(new FallbackRatesProvider().name).toBe('fallback');
    });

    it('возвращает зашитые курсы для известных валют', async () => {
        const quotes = await new FallbackRatesProvider().fetchLatest(['USD', 'EUR', 'RUB']);
        expect(quotes).toEqual([
            { currency: 'USD', rate: 390 },
            { currency: 'EUR', rate: 420 },
            { currency: 'RUB', rate: 4.2 },
        ]);
    });

    it('пропускает неизвестные валюты', async () => {
        const quotes = await new FallbackRatesProvider().fetchLatest(['USD', 'GBP']);
        expect(quotes).toEqual([{ currency: 'USD', rate: 390 }]);
    });
});
