import { ValidationException } from '@brickam/core-kit';
import { type ValidationError, ValidationPipe } from '@nestjs/common';

/** Разворачивает дерево ошибок class-validator в плоский список. */
const flatten = (errors: ValidationError[], parent = ''): unknown[] => {
    const out: unknown[] = [];
    for (const error of errors) {
        const path = parent ? `${parent}.${error.property}` : error.property;
        if (error.constraints) {
            out.push({ field: path, messages: Object.values(error.constraints) });
        }
        if (error.children && error.children.length > 0) {
            out.push(...flatten(error.children, path));
        }
    }
    return out;
};

/**
 * Глобальный ValidationPipe (whitelist + forbidNonWhitelisted + transform).
 * Ошибки конвертируются в нашу ValidationException (422) с деталями полей.
 */
export const createValidationPipe = (): ValidationPipe =>
    new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        exceptionFactory: (errors: ValidationError[]) =>
            new ValidationException('errors.validation', flatten(errors)),
    });
