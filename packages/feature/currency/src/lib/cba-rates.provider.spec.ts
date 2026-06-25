import { ServiceUnavailableException } from '@brickam/core-kit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CbaRatesProvider } from './cba-rates.provider';

describe('CbaRatesProvider', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('имеет имя cba', () => {
        expect(new CbaRatesProvider().name).toBe('cba');
    });

    it('парсит ответ в котировки только для запрошенных валют', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({
                ok: true,
                json: async () => ({ USD: 390.5, EUR: '420.1', RUB: 4.2, GBP: 500 }),
            })),
        );

        const provider = new CbaRatesProvider();
        const quotes = await provider.fetchLatest(['USD', 'EUR']);

        expect(quotes).toEqual([
            { currency: 'USD', rate: 390.5 },
            { currency: 'EUR', rate: 420.1 },
        ]);
    });

    it('пропускает валюты без валидного курса', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({
                ok: true,
                json: async () => ({ USD: 390, EUR: 'n/a' }),
            })),
        );

        const provider = new CbaRatesProvider();
        const quotes = await provider.fetchLatest(['USD', 'EUR', 'RUB']);

        expect(quotes).toEqual([{ currency: 'USD', rate: 390 }]);
    });

    it('сетевая ошибка → ServiceUnavailableException (фолбэк в сервисе)', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => {
                throw new Error('ECONNRESET');
            }),
        );

        const provider = new CbaRatesProvider();
        await expect(provider.fetchLatest(['USD'])).rejects.toBeInstanceOf(
            ServiceUnavailableException,
        );
    });

    it('не-200 ответ → ServiceUnavailableException', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })),
        );

        const provider = new CbaRatesProvider();
        await expect(provider.fetchLatest(['USD'])).rejects.toBeInstanceOf(
            ServiceUnavailableException,
        );
    });
});
