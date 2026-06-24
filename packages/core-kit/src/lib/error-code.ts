/**
 * Машинный каталог кодов ошибок (Foundations §8).
 * Базовые коды живут здесь; доменные пакеты определяют собственные строковые коды
 * и наследуют AppException, переиспользуя httpStatus базовых классов.
 */
export enum ErrorCode {
    // 4xx — клиентские
    BAD_REQUEST = 'BAD_REQUEST',
    VALIDATION_FAILED = 'VALIDATION_FAILED',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    NOT_FOUND = 'NOT_FOUND',
    CONFLICT = 'CONFLICT',
    RATE_LIMITED = 'RATE_LIMITED',

    // 5xx — серверные
    INTERNAL = 'INTERNAL',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}
