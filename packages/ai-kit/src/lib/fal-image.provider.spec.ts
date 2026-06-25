import { afterEach, describe, expect, it, vi } from 'vitest';
import { FalImageProvider } from './fal-image.provider';

describe('FalImageProvider', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('имеет имя fal', () => {
        expect(new FalImageProvider('key').name).toBe('fal');
    });

    it('возвращает url первого изображения из ответа', async () => {
        const fetchMock = vi.fn(async () => ({
            ok: true,
            json: async () => ({ images: [{ url: 'https://fal/out.png' }] }),
        }));
        vi.stubGlobal('fetch', fetchMock);

        const result = await new FalImageProvider('fal-key').generate('кирпич');
        expect(result).toEqual({ url: 'https://fal/out.png' });
        // Ключ уходит как Authorization: Key ...; body содержит prompt.
        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        const headers = init.headers as Record<string, string>;
        expect(headers['authorization']).toBe('Key fal-key');
        expect(init.body).toContain('кирпич');
    });

    it('пустой ответ images → ошибка', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({ ok: true, json: async () => ({ images: [] }) })),
        );
        await expect(new FalImageProvider('k').generate('p')).rejects.toThrow(/пустой ответ/);
    });

    it('не-200 ответ → ошибка с кодом', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({ ok: false, status: 500, text: async () => 'boom' })),
        );
        await expect(new FalImageProvider('k').generate('p')).rejects.toThrow(/500/);
    });
});
