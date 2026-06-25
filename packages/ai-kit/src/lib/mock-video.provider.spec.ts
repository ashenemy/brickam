import { describe, expect, it } from 'vitest';
import { MockVideoProvider } from './mock-video.provider';

describe('MockVideoProvider', () => {
    const provider = new MockVideoProvider();

    it('name = mock', () => {
        expect(provider.name).toBe('mock');
    });

    it('slideshow возвращает url + thumbnailUrl (= первое фото)', async () => {
        const images = ['https://cdn/1.png', 'https://cdn/2.png'];
        const result = await provider.slideshow(images, 'промо');
        expect(result.url).toMatch(/^https:\/\/mock\.local\/vid\/[0-9a-f]+\.mp4$/);
        expect(result.thumbnailUrl).toBe('https://cdn/1.png');
    });

    it('детерминирован для одинакового входа', async () => {
        const images = ['a', 'b'];
        const a = await provider.slideshow(images, 'p');
        const b = await provider.slideshow(images, 'p');
        expect(a.url).toBe(b.url);
    });

    it('разный набор фото/промпт → разный url', async () => {
        const a = await provider.slideshow(['a'], 'p');
        const b = await provider.slideshow(['b'], 'p');
        expect(a.url).not.toBe(b.url);
    });

    it('без фото thumbnailUrl отсутствует', async () => {
        const result = await provider.slideshow([], 'p');
        expect(result.thumbnailUrl).toBeUndefined();
    });
});
