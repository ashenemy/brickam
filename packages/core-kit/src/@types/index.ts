// Все типы пакета core-kit — единый баррель.

/** Произвольные детали ошибки (валидация полей, контекст). */
export type ErrorDetails = Record<string, unknown> | unknown[];

/** Опции конструктора AppException. */
export type AppExceptionOptions = {
    code: string;
    httpStatus: number;
    messageKey: string;
    details?: ErrorDetails | undefined;
    cause?: unknown;
};

/** Унифицированный конверт ошибки (Foundations §8). */
export type ErrorEnvelope = {
    success: false;
    error: {
        code: string;
        message: string;
        details?: ErrorDetails;
        traceId?: string;
    };
};

/** Унифицированный конверт успеха (Foundations §8). */
export type SuccessEnvelope<TData> = {
    success: true;
    data: TData;
    meta?: Record<string, unknown>;
};

export type ResponseEnvelope<TData> = SuccessEnvelope<TData> | ErrorEnvelope;

/** Result-тип в функциональном стиле. */
export type Ok<TValue> = { readonly ok: true; readonly value: TValue };
export type Err<TError> = { readonly ok: false; readonly error: TError };
export type Result<TValue, TError = Error> = Ok<TValue> | Err<TError>;

/** Конструктор класса (для дженерик-фабрик). */
export type Constructor<T = unknown> = new (...args: any[]) => T;

/** Параметры пагинации (нормализованные). */
export type PaginationParams = {
    page: number;
    pageSize: number;
};

/** Метаданные страницы (Foundations §7). */
export type PaginationMeta = {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
};

/** Страница результатов. */
export type Page<T> = {
    data: T[];
    meta: PaginationMeta;
};
