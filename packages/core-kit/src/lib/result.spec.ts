import { describe, expect, it } from 'vitest';
import { ensure, ensureDefined, isDefined, isNil } from './guards';
import { err, isErr, isOk, ok, tryCatch, unwrap, unwrapOr } from './result';

describe('Result', () => {
    it('ok/err конструируют корректные варианты', () => {
        expect(ok(5)).toEqual({ ok: true, value: 5 });
        expect(err('x')).toEqual({ ok: false, error: 'x' });
        expect(isOk(ok(1))).toBe(true);
        expect(isErr(err(1))).toBe(true);
    });

    it('unwrap извлекает значение либо бросает', () => {
        expect(unwrap(ok(42))).toBe(42);
        expect(() => unwrap(err(new Error('nope')))).toThrow('nope');
    });

    it('unwrapOr возвращает дефолт на ошибке', () => {
        expect(unwrapOr(ok(1), 9)).toBe(1);
        expect(unwrapOr(err('e'), 9)).toBe(9);
    });

    it('tryCatch оборачивает исключение', () => {
        const good = tryCatch(() => 2 + 2);
        expect(good).toEqual({ ok: true, value: 4 });
        const bad = tryCatch(() => {
            throw new Error('fail');
        });
        expect(isErr(bad)).toBe(true);
    });
});

describe('guards', () => {
    it('isDefined / isNil', () => {
        expect(isDefined(0)).toBe(true);
        expect(isDefined(null)).toBe(false);
        expect(isNil(undefined)).toBe(true);
        expect(isNil('')).toBe(false);
    });

    it('ensure бросает при ложном условии', () => {
        expect(() => ensure(false)).toThrow();
        expect(() => ensure(true)).not.toThrow();
    });

    it('ensureDefined возвращает значение либо бросает', () => {
        expect(ensureDefined('v')).toBe('v');
        expect(() => ensureDefined(null)).toThrow();
    });
});
