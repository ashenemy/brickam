import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RUNTIME_CONFIG } from '@brickam/config-kit/browser';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type {
    ApiResponse,
    BulkApplyResult,
    BulkOp,
    BulkPreviewResult,
    BulkRequest,
} from './models';

/**
 * Доступ к API массовых операций над товарами вендора.
 * POST /vendor-bulk/preview — расчёт до/после без записи.
 * POST /vendor-bulk/apply — применение (sync для малых наборов, иначе queued).
 * vendorId на бэке берётся из контекста продавца — в теле не передаётся.
 */
@Injectable({ providedIn: 'root' })
export class BulkApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Предпросмотр массовой операции (до/после). */
    preview(productIds: string[], op: BulkOp): Observable<BulkPreviewResult> {
        const body: BulkRequest = { productIds, op };
        return this.http
            .post<ApiResponse<BulkPreviewResult>>(`${this.base}/vendor-bulk/preview`, body)
            .pipe(map((res) => res.data));
    }

    /** Применяет массовую операцию. */
    apply(productIds: string[], op: BulkOp): Observable<BulkApplyResult> {
        const body: BulkRequest = { productIds, op };
        return this.http
            .post<ApiResponse<BulkApplyResult>>(`${this.base}/vendor-bulk/apply`, body)
            .pipe(map((res) => res.data));
    }
}
