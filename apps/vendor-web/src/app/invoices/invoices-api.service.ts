import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RUNTIME_CONFIG } from '@brickam/config-kit/browser';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse, CreateInvoicePayload, Invoice } from './models';

/**
 * Доступ к API инвойсов. База берётся из RUNTIME_CONFIG.apiBaseUrl.
 * Все эндпоинты требуют JWT Bearer — токен добавляет authInterceptor.
 */
@Injectable({ providedIn: 'root' })
export class InvoicesApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Создать инвойс (status draft). */
    create(payload: CreateInvoicePayload): Observable<Invoice> {
        return this.http
            .post<ApiResponse<Invoice>>(`${this.base}/invoices`, payload)
            .pipe(map((res) => res.data));
    }

    /** Отправить инвойс в чат (status sent). */
    send(id: string): Observable<Invoice> {
        return this.http
            .post<ApiResponse<Invoice>>(`${this.base}/invoices/${encodeURIComponent(id)}/send`, {})
            .pipe(map((res) => res.data));
    }

    /** Прямая ссылка на PDF инвойса (открывать в новой вкладке). */
    pdfUrl(id: string): string {
        return `${this.base}/invoices/${encodeURIComponent(id)}/pdf`;
    }
}
