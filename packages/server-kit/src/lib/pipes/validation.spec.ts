import { ValidationException } from '@brickam/core-kit';
import type { ValidationError } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { createValidationPipe } from './validation';

describe('createValidationPipe', () => {
    it('создаёт ValidationPipe с exceptionFactory → ValidationException', () => {
        const pipe = createValidationPipe();
        const factory = (pipe as any).exceptionFactory as (errors: ValidationError[]) => unknown;
        const errors: ValidationError[] = [
            {
                property: 'phone',
                constraints: { isNotEmpty: 'phone обязателен' },
                children: [],
            },
            {
                property: 'address',
                children: [
                    { property: 'city', constraints: { isString: 'city строка' }, children: [] },
                ],
            },
        ];
        const ex = factory(errors) as ValidationException;
        expect(ex).toBeInstanceOf(ValidationException);
        expect(ex.httpStatus).toBe(422);
        expect(ex.details).toEqual([
            { field: 'phone', messages: ['phone обязателен'] },
            { field: 'address.city', messages: ['city строка'] },
        ]);
    });
});
