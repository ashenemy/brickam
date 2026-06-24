import { describe, expect, it } from 'vitest';
import { deepMerge } from './deep-merge';

describe('deepMerge', () => {
    it('рекурсивно сливает вложенные объекты', () => {
        const base = { server: { port: 3000, prefix: 'api' }, a: 1 };
        const overlay = { server: { port: 4000 }, b: 2 };
        expect(deepMerge(base, overlay)).toEqual({
            server: { port: 4000, prefix: 'api' },
            a: 1,
            b: 2,
        });
    });

    it('массивы заменяются целиком, а не конкатенируются', () => {
        const base = { list: [1, 2, 3] };
        const overlay = { list: [9] };
        expect(deepMerge(base, overlay)).toEqual({ list: [9] });
    });

    it('не мутирует исходный объект', () => {
        const base = { nested: { x: 1 } };
        deepMerge(base, { nested: { y: 2 } });
        expect(base).toEqual({ nested: { x: 1 } });
    });
});
