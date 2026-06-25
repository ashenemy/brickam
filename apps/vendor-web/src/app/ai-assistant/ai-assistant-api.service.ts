import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RUNTIME_CONFIG } from '@brickam/config-kit/browser';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { AiJob, ApiResponse, CreateAiJobPayload } from './models';

/**
 * Доступ к API AI-ассистента продавца (генерация описаний/картинок/видео).
 * База — RUNTIME_CONFIG.apiBaseUrl, JWT Bearer добавляет authInterceptor.
 * Требуется право products.manage.
 */
@Injectable({ providedIn: 'root' })
export class AiAssistantApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Создаёт задачу генерации. */
    create(payload: CreateAiJobPayload): Observable<AiJob> {
        return this.http
            .post<ApiResponse<AiJob>>(`${this.base}/ai-assistant/jobs`, payload)
            .pipe(map((res) => res.data));
    }

    /** Список задач генерации. */
    list(): Observable<AiJob[]> {
        return this.http
            .get<ApiResponse<AiJob[]>>(`${this.base}/ai-assistant/jobs`)
            .pipe(map((res) => res.data));
    }

    /** Получает одну задачу (для опроса статуса/прогресса). */
    get(id: string): Observable<AiJob> {
        return this.http
            .get<ApiResponse<AiJob>>(`${this.base}/ai-assistant/jobs/${encodeURIComponent(id)}`)
            .pipe(map((res) => res.data));
    }

    /** Прикрепляет результат задачи как обложку товара. */
    attach(id: string): Observable<AiJob> {
        return this.http
            .post<ApiResponse<AiJob>>(
                `${this.base}/ai-assistant/jobs/${encodeURIComponent(id)}/attach`,
                {},
            )
            .pipe(map((res) => res.data));
    }
}
