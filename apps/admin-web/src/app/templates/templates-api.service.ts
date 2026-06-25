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

/** Поддерживаемые языки контента шаблона. */
export type TemplateLang = 'hy' | 'ru' | 'en';

/** Локализованный контент шаблона. */
export type TemplateContent = Record<TemplateLang, string>;

/** Элемент списка шаблонов. */
export type TemplateListItem = {
    key: string;
    subject?: string;
};

/** Полный шаблон. */
export type Template = {
    key: string;
    content: TemplateContent;
    variables: string[];
    subject?: string;
};

/** Тело сохранения шаблона. */
export type UpdateTemplatePayload = {
    content: TemplateContent;
    variables: string[];
    subject?: string;
};

/** Результат превью. */
export type TemplatePreview = {
    rendered: string;
    subject?: string;
};

/**
 * API шаблонов уведомлений/писем (роль admin). Список, чтение, сохранение (PUT),
 * рендер-превью (POST .../preview) с языком и sample-переменными.
 */
@Injectable({ providedIn: 'root' })
export class TemplatesApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Список шаблонов. */
    list(): Observable<TemplateListItem[]> {
        return this.http
            .get<ApiResponse<TemplateListItem[]>>(`${this.base}/admin/templates`)
            .pipe(map((res) => res.data));
    }

    /** Шаблон по ключу. */
    get(key: string): Observable<Template> {
        return this.http
            .get<ApiResponse<Template>>(`${this.base}/admin/templates/${encodeURIComponent(key)}`)
            .pipe(map((res) => res.data));
    }

    /** Сохранить шаблон. */
    update(key: string, payload: UpdateTemplatePayload): Observable<Template> {
        return this.http
            .put<ApiResponse<Template>>(
                `${this.base}/admin/templates/${encodeURIComponent(key)}`,
                payload,
            )
            .pipe(map((res) => res.data));
    }

    /** Превью рендера шаблона на языке lang с переменными vars. */
    preview(
        key: string,
        lang: TemplateLang,
        vars: Record<string, string>,
    ): Observable<TemplatePreview> {
        return this.http
            .post<ApiResponse<TemplatePreview>>(
                `${this.base}/admin/templates/${encodeURIComponent(key)}/preview`,
                { lang, vars },
            )
            .pipe(map((res) => res.data));
    }
}
