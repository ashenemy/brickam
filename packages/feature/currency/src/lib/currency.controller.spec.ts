import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CurrencyController } from './currency.controller';
import type { CurrencyService } from './currency.service';

describe('CurrencyController', () => {
    let service: {
        getRates: ReturnType<typeof vi.fn>;
        convert: ReturnType<typeof vi.fn>;
        displayCurrencies: ReturnType<typeof vi.fn>;
        baseCurrency: string;
    };
    let controller: CurrencyController;

    beforeEach(() => {
        service = {
            getRates: vi.fn(),
            convert: vi.fn(),
            displayCurrencies: vi.fn(() => ['AMD', 'USD', 'EUR', 'RUB']),
            baseCurrency: 'AMD',
        };
        controller = new CurrencyController(service as unknown as CurrencyService);
    });

    it('getRates делегирует сервису', async () => {
        const rates = [{ currency: 'AMD', rate: 1, fetchedAt: new Date() }];
        service.getRates.mockResolvedValue(rates);
        await expect(controller.getRates()).resolves.toBe(rates);
    });

    it('getDisplayCurrencies возвращает базу и список валют', () => {
        expect(controller.getDisplayCurrencies()).toEqual({
            base: 'AMD',
            currencies: ['AMD', 'USD', 'EUR', 'RUB'],
        });
    });

    it('convert конвертирует сумму в AMD в целевую валюту', async () => {
        service.convert.mockResolvedValue(2.5);
        const result = await controller.convert({ amount: 1000, to: 'USD' });
        expect(service.convert).toHaveBeenCalledWith(1000, 'USD');
        expect(result).toEqual({ amount: 1000, currency: 'USD', converted: 2.5 });
    });
});
