import { describe, expect, it } from 'vitest';
import { hashString, MockImageProvider } from './mock-image.provider';

describe('MockImageProvider', () => {
    const provider = new MockImageProvider();

    it('name = mock', () => {
        expect(provider.name).toBe('mock');
    });

    it('generate детерминирован: одинаковый промпт → одинаковый url', async () => {
        const a = await provider.generate('красный кирпич');
        const b = await provider.generate('красный кирпич');
        expect(a.url).toBe(b.url);
    });

    it('разные промпты → разные url', async () => {
        const a = await provider.generate('красный кирпич');
        const b = await provider.generate('серый бетон');
        expect(a.url).not.toBe(b.url);
    });

    it('url имеет ожидаемый mock-формат без сети', async () => {
        const { url } = await provider.generate('plinth');
        expect(url).toMatch(/^https:\/\/mock\.local\/img\/[0-9a-f]+\.png$/);
    });

    it('hashString стабилен', () => {
        expect(hashString('abc')).toBe(hashString('abc'));
        expect(hashString('abc')).not.toBe(hashString('abd'));
    });
});
