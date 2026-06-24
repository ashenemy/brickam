import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RUNTIME_CONFIG } from '@brickam/config-kit/browser';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse } from '../catalog/models';
import type { ChatView, MessageView } from './models';

/**
 * Доступ к REST API чата. Все эндпоинты требуют JWT (добавляется authInterceptor).
 * База — из RUNTIME_CONFIG.apiBaseUrl.
 */
@Injectable({ providedIn: 'root' })
export class ChatApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Список диалогов текущего пользователя. */
    list(): Observable<ChatView[]> {
        return this.http
            .get<ApiResponse<ChatView[]>>(`${this.base}/chat`)
            .pipe(map((res) => res.data));
    }

    /** Получить или создать чат с продавцом. */
    getOrCreate(vendorId: string): Observable<ChatView> {
        return this.http
            .post<ApiResponse<ChatView>>(`${this.base}/chat`, { vendorId })
            .pipe(map((res) => res.data));
    }

    /** Сообщения чата (страница пагинации). */
    messages(chatId: string, page = 1, pageSize = 30): Observable<MessageView[]> {
        const params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
        return this.http
            .get<ApiResponse<MessageView[]>>(
                `${this.base}/chat/${encodeURIComponent(chatId)}/messages`,
                { params },
            )
            .pipe(map((res) => res.data));
    }

    /** Отметить чат прочитанным. */
    markRead(chatId: string): Observable<unknown> {
        return this.http
            .post<ApiResponse<unknown>>(`${this.base}/chat/${encodeURIComponent(chatId)}/read`, {})
            .pipe(map((res) => res.data));
    }
}
