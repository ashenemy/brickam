import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import { IDEMPOTENT_KEY, Idempotent } from './idempotent.decorator';

describe('Idempotent', () => {
    const reflector = new Reflector();

    it('ставит метаданные IDEMPOTENT_KEY=true на хендлер', () => {
        class Ctrl {
            @Idempotent()
            create(): void {}
        }
        expect(reflector.get(IDEMPOTENT_KEY, Ctrl.prototype.create)).toBe(true);
    });

    it('не ставит метаданные на непомеченный хендлер', () => {
        class Ctrl {
            read(): void {}
        }
        expect(reflector.get(IDEMPOTENT_KEY, Ctrl.prototype.read)).toBeUndefined();
    });
});
