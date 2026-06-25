import { describe, expect, it } from 'vitest';
import { extractJson } from './extract-json.util';

describe('extractJson (Foundations §13)', () => {
    it('снимает markdown-ограждение ```json ... ```', () => {
        const raw = '```json\n{"a":1,"b":"x"}\n```';
        expect(JSON.parse(extractJson(raw))).toEqual({ a: 1, b: 'x' });
    });

    it('снимает ограждение без указания языка', () => {
        const raw = '```\n{"a":1}\n```';
        expect(JSON.parse(extractJson(raw))).toEqual({ a: 1 });
    });

    it('отбрасывает мусор по краям и берёт первую {...}-группу', () => {
        const raw = 'Вот результат: {"projectType":"кухня","themes":[]} — готово.';
        expect(JSON.parse(extractJson(raw))).toEqual({ projectType: 'кухня', themes: [] });
    });

    it('корректно обрабатывает вложенные объекты', () => {
        const raw = 'prefix {"a":{"b":{"c":1}}} suffix';
        expect(JSON.parse(extractJson(raw))).toEqual({ a: { b: { c: 1 } } });
    });

    it('не путается из-за фигурных скобок внутри строки', () => {
        const raw = '{"text":"a } b { c"}';
        expect(JSON.parse(extractJson(raw))).toEqual({ text: 'a } b { c' });
    });

    it('учитывает экранированную кавычку в строке', () => {
        const raw = '{"q":"say \\"hi\\" }"}';
        expect(JSON.parse(extractJson(raw))).toEqual({ q: 'say "hi" }' });
    });

    it('возвращает trimmed-исходник, если объекта нет', () => {
        expect(extractJson('  no json here  ')).toBe('no json here');
    });
});
