import { isPlatformBrowser } from '@angular/common';
import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { CurrencyApiService } from './currency-api.service';

const BASE_CURRENCY = 'AMD';
const STORAGE_KEY = 'brickam.currency';

/**
 * Глобальное состояние валюты ОТОБРАЖЕНИЯ (signals). База — AMD.
 *
 * ВАЖНО: конвертация применяется ТОЛЬКО к показу цен. Суммы корзины/заказа
 * и любые данные, уходящие на бэкенд, остаются в AMD — store их не трогает.
 */
@Injectable({ providedIn: 'root' })
export class CurrencyStore {
    private readonly api = inject(CurrencyApiService);
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    /** Доступные валюты отображения (всегда содержит AMD). */
    readonly currencies = signal<string[]>([BASE_CURRENCY]);
    /** Курсы: currency → rate (AMD за 1 единицу). */
    readonly rates = signal<Map<string, number>>(new Map([[BASE_CURRENCY, 1]]));
    /** Текущая выбранная валюта отображения. */
    readonly selected = signal<string>(BASE_CURRENCY);

    constructor() {
        // Восстановление выбора из localStorage (только в браузере).
        if (this.isBrowser) {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    this.selected.set(stored);
                }
            } catch {
                // приватный режим/недоступный storage — игнорируем
            }
        }
    }

    /**
     * Грузит список валют отображения и курсы. SSR-безопасно: ошибки глушатся
     * через catchError, на сервере остаётся фолбэк на AMD.
     */
    load(): void {
        forkJoin({
            display: this.api.displayCurrencies().pipe(catchError(() => of(null))),
            rates: this.api.rates().pipe(catchError(() => of(null))),
        }).subscribe(({ display, rates }) => {
            if (display?.currencies?.length) {
                this.currencies.set(display.currencies);
                // Если ранее выбранная валюта исчезла из списка — откат на AMD.
                if (!display.currencies.includes(this.selected())) {
                    this.selected.set(BASE_CURRENCY);
                }
            }
            if (rates) {
                const map = new Map<string, number>([[BASE_CURRENCY, 1]]);
                for (const r of rates) {
                    map.set(r.currency, r.rate);
                }
                this.rates.set(map);
            }
        });
    }

    /** Меняет выбранную валюту и персистит её в localStorage (только браузер). */
    select(currency: string): void {
        this.selected.set(currency);
        if (this.isBrowser) {
            try {
                localStorage.setItem(STORAGE_KEY, currency);
            } catch {
                // недоступный storage — игнорируем
            }
        }
    }

    /**
     * Конвертирует сумму из AMD в выбранную валюту ДЛЯ ОТОБРАЖЕНИЯ.
     * AMD → identity. Нет курса → фолбэк на исходную сумму (AMD).
     */
    convert(amountAmd: number): number {
        const currency = this.selected();
        if (currency === BASE_CURRENCY) {
            return amountAmd;
        }
        const rate = this.rates().get(currency);
        if (!rate || rate <= 0) {
            return amountAmd;
        }
        return Math.round((amountAmd / rate) * 100) / 100;
    }

    /**
     * Конвертирует и форматирует сумму с символом/кодом выбранной валюты.
     * Intl под isPlatformBrowser-фолбэком безопасен (доступен в Node SSR).
     */
    format(amountAmd: number): string {
        const currency = this.selected();
        const value = this.convert(amountAmd);
        if (currency === BASE_CURRENCY) {
            // AMD: целые суммы + армянский символ драма.
            return `${Math.round(value).toLocaleString('ru-RU')} ֏`;
        }
        try {
            return new Intl.NumberFormat('ru-RU', {
                style: 'currency',
                currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(value);
        } catch {
            // Неизвестный валютный код для Intl — простой фолбэк.
            return `${value.toLocaleString('ru-RU')} ${currency}`;
        }
    }
}
