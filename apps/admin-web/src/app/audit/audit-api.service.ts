import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RUNTIME_CONFIG } from '@brickam/config-kit/browser';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Конверт ответа API. */
type ApiResponse<T> = {
    success: boolean;
    data: T;
};

/** Событие аудита. */
export type AuditEvent = {
    id: string;
    action: string;
    actorId?: string;
    targetType?: string;
    targetId?: string;
    createdAt?: string;
};

/**
 * API журнала аудита (роль admin). Последние события с лимитом.
 */
@Injectable({ providedIn: 'root' })
export class AuditApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Последние события аудита (по умолчанию 50). */
    list(limit = 50): Observable<AuditEvent[]> {
        const params = new HttpParams().set('limit', String(limit));
        return this.http
            .get<ApiResponse<AuditEvent[]>>(`${this.base}/audit`, { params })
            .pipe(map((res) => res.data));
    }
}
