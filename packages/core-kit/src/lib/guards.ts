import { ValidationException } from './exceptions';

/** Узкий тип: значение определено (не null/undefined). */
export const isDefined = <T>(value: T | null | undefined): value is T =>
    value !== null && value !== undefined;

export const isNil = (value: unknown): value is null | undefined =>
    value === null || value === undefined;

/** Бросает ValidationException, если условие ложно. Сужает тип. */
export function ensure(condition: unknown, messageKey = 'errors.validation'): asserts condition {
    if (!condition) {
        throw new ValidationException(messageKey);
    }
}

/** Возвращает значение или бросает ValidationException, если оно nil. */
export const ensureDefined = <T>(
    value: T | null | undefined,
    messageKey = 'errors.notFound',
): T => {
    if (isNil(value)) {
        throw new ValidationException(messageKey);
    }
    return value;
};
