import type { Err, Ok, Result } from '../@types';

/** Конструктор успешного результата. */
export const ok = <TValue>(value: TValue): Ok<TValue> => ({ ok: true, value });

/** Конструктор результата с ошибкой. */
export const err = <TError>(error: TError): Err<TError> => ({ ok: false, error });

export const isOk = <TValue, TError>(result: Result<TValue, TError>): result is Ok<TValue> =>
    result.ok;

export const isErr = <TValue, TError>(result: Result<TValue, TError>): result is Err<TError> =>
    !result.ok;

/** Извлекает значение либо бросает ошибку результата. */
export const unwrap = <TValue, TError>(result: Result<TValue, TError>): TValue => {
    if (result.ok) {
        return result.value;
    }
    throw result.error instanceof Error ? result.error : new Error(String(result.error));
};

/** Извлекает значение либо возвращает дефолт. */
export const unwrapOr = <TValue, TError>(
    result: Result<TValue, TError>,
    fallback: TValue,
): TValue => (result.ok ? result.value : fallback);

/** Оборачивает потенциально бросающую функцию в Result. */
export const tryCatch = <TValue>(fn: () => TValue): Result<TValue, Error> => {
    try {
        return ok(fn());
    } catch (error) {
        return err(error instanceof Error ? error : new Error(String(error)));
    }
};
