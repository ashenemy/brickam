import type { AppExceptionOptions, ErrorDetails } from '../@types';

/**
 * Базовое доменно-агностичное исключение приложения.
 * Несёт машинный `code`, HTTP-статус и i18n-ключ сообщения (`messageKey`),
 * который локализуется на границе (AllExceptionsFilter в server-kit).
 */
export abstract class AppException extends Error {
    readonly code: string;
    readonly httpStatus: number;
    readonly messageKey: string;
    // declare: поле существует только если реально присвоено (exactOptionalPropertyTypes),
    // иначе useDefineForClassFields создал бы его со значением undefined.
    declare readonly details?: ErrorDetails;

    protected constructor(options: AppExceptionOptions) {
        super(
            options.messageKey,
            options.cause !== undefined ? { cause: options.cause } : undefined,
        );
        // new.target держит реальный подкласс — имя выставляем корректно.
        this.name = new.target.name;
        this.code = options.code;
        this.httpStatus = options.httpStatus;
        this.messageKey = options.messageKey;
        if (options.details !== undefined) {
            this.details = options.details;
        }
        // Корректный прототип после транспиляции в ES5/ES2015-цели.
        Object.setPrototypeOf(this, new.target.prototype);
    }

    /** Безопасное для логов представление (без stack). */
    toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            code: this.code,
            httpStatus: this.httpStatus,
            messageKey: this.messageKey,
            ...(this.details !== undefined ? { details: this.details } : {}),
        };
    }
}
