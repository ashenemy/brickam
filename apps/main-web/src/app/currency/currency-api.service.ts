import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RUNTIME_CONFIG } from '@brickam/config-kit/browser';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Курс валюты: rate = сколько AMD за 1 единицу валюты (AMD имеет rate=1). */
export type CurrencyRate = {
    currency: string;
    rate: number;
    fetchedAt: string;
};

/** Список валют отображения с базовой валютой. */
export type DisplayCurrencies = {
    base: string;
    currencies: string[];
};

type ApiResponse<T> = { success: boolean; data: T };

/**
 * Доступ к валютному API бэкенда (публичные эндпоинты, без токена).
 * База берётся из RUNTIME_CONFIG.apiBaseUrl. Работает и на сервере (SSR).
 */
@Injectable({ providedIn: 'root' })
export class CurrencyApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Курсы валют (AMD за 1 единицу). */
    rates(): Observable<CurrencyRate[]> {
        return this.http
            .get<ApiResponse<CurrencyRate[]>>(`${this.base}/currency/rates`)
            .pipe(map((res) => res.data));
    }

    /** Список валют отображения (base + currencies). */
    displayCurrencies(): Observable<DisplayCurrencies> {
        return this.http
            .get<ApiResponse<DisplayCurrencies>>(`${this.base}/currency/display-currencies`)
            .pipe(map((res) => res.data));
    }
}
