import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RUNTIME_CONFIG } from '@brickam/config-kit/browser';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Конверт ответа API. */
type ApiResponse<T> = {
    success: boolean;
    data: T;
};

/** Код права суб-аккаунта (подмножество Permission). */
export type MemberPermission =
    | 'orders.view'
    | 'products.manage'
    | 'analytics.view'
    | 'chat.handle'
    | 'invoices.create';

/** Член команды вендора. */
export type VendorMember = {
    id: string;
    vendorId: string;
    userId: string;
    role: string;
    permissions: string[];
};

/**
 * Доступ к API суб-аккаунтов вендора.
 * GET /vendor-members, POST /vendor-members {phone,permissions[]},
 * PATCH /vendor-members/:userId {permissions[]}, DELETE /vendor-members/:userId.
 * vendorId на бэке берётся из контекста владельца.
 */
@Injectable({ providedIn: 'root' })
export class MembersApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Список членов команды. */
    list(): Observable<VendorMember[]> {
        return this.http
            .get<ApiResponse<VendorMember[]>>(`${this.base}/vendor-members`)
            .pipe(map((res) => res.data));
    }

    /** Добавляет суб-аккаунт по телефону с набором прав. */
    add(phone: string, permissions: string[]): Observable<VendorMember> {
        return this.http
            .post<ApiResponse<VendorMember>>(`${this.base}/vendor-members`, { phone, permissions })
            .pipe(map((res) => res.data));
    }

    /** Меняет права суб-аккаунта. */
    update(userId: string, permissions: string[]): Observable<VendorMember> {
        return this.http
            .patch<ApiResponse<VendorMember>>(
                `${this.base}/vendor-members/${encodeURIComponent(userId)}`,
                { permissions },
            )
            .pipe(map((res) => res.data));
    }

    /** Удаляет суб-аккаунт. */
    remove(userId: string): Observable<void> {
        return this.http
            .delete<ApiResponse<void>>(`${this.base}/vendor-members/${encodeURIComponent(userId)}`)
            .pipe(map(() => undefined));
    }
}
