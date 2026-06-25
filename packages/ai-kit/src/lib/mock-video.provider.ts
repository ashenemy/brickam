import { VideoProvider } from '@brickam/domain-kit';
import { hashString } from './mock-image.provider';

/** База mock-URL видео (не сетевой адрес, только заглушка). */
const MOCK_VIDEO_BASE = 'https://mock.local/vid';

/**
 * Детерминированный mock провайдера видео (Foundations §13). Используется, когда
 * ffmpeg недоступен и в тестах. slideshow() возвращает стабильный URL-заглушку,
 * зависящий от набора фото + промпта; thumbnailUrl — первое фото (если есть).
 * Без сети/ffmpeg.
 */
export class MockVideoProvider extends VideoProvider {
    readonly name = 'mock';

    async slideshow(
        imageUrls: string[],
        prompt: string,
    ): Promise<{ url: string; thumbnailUrl?: string }> {
        const seed = [...imageUrls, prompt].join('|');
        const result: { url: string; thumbnailUrl?: string } = {
            url: `${MOCK_VIDEO_BASE}/${hashString(seed)}.mp4`,
        };
        const first = imageUrls[0];
        if (first !== undefined) {
            result.thumbnailUrl = first;
        }
        return result;
    }
}
