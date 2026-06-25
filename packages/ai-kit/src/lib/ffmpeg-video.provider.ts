import { spawn } from 'node:child_process';
import { VideoProvider } from '@brickam/domain-kit';

/** Длительность показа одного кадра в слайдшоу (сек). */
const FRAME_DURATION_SEC = 2;
/** Частота кадров результирующего ролика. */
const OUTPUT_FPS = 25;

/**
 * Строит массив аргументов ffmpeg для слайдшоу из набора фото (чистая функция,
 * без побочных эффектов — её и тестируем). Каждый кадр показывается
 * FRAME_DURATION_SEC секунд; вход — список локальных путей/URL картинок, выход —
 * путь до mp4. Реальная подготовка файлов (скачивание фото) — забота вызова.
 */
export function buildFfmpegArgs(imagePaths: string[], outputPath: string): string[] {
    const args: string[] = [];
    for (const path of imagePaths) {
        args.push('-loop', '1', '-t', String(FRAME_DURATION_SEC), '-i', path);
    }
    // concat-фильтр склеивает входы по порядку в один поток.
    const inputs = imagePaths.map((_, index) => `[${index}:v]`).join('');
    const filter = `${inputs}concat=n=${imagePaths.length}:v=1:a=0[v]`;
    args.push('-filter_complex', filter, '-map', '[v]');
    args.push('-r', String(OUTPUT_FPS), '-pix_fmt', 'yuv420p', '-y', outputPath);
    return args;
}

/**
 * Скелет провайдера видео на ffmpeg (Foundations §13). Собирает слайдшоу из фото
 * через вызов системного `ffmpeg` (child_process). В окружении без ffmpeg/файлов
 * запуск падает — фабрика модуля по конфигу должна выбирать mock там, где ffmpeg
 * недоступен. Импорт безопасен: spawn вызывается только внутри slideshow() под
 * try/catch, поэтому модуль грузится без ffmpeg. РЕАЛЬНЫЙ запуск в тестах не
 * выполняется.
 */
export class FfmpegVideoProvider extends VideoProvider {
    readonly name = 'ffmpeg';

    async slideshow(
        imageUrls: string[],
        _prompt: string,
    ): Promise<{ url: string; thumbnailUrl?: string }> {
        if (imageUrls.length === 0) {
            throw new Error('ffmpeg slideshow: нет входных изображений');
        }
        // ПРИМЕЧАНИЕ: реальная реализация должна скачать imageUrls во временные
        // файлы и передать их пути в buildFfmpegArgs. Здесь оставлен скелет:
        // путей до локальных файлов нет, поэтому генерация заведомо недоступна и
        // мы пробрасываем ошибку, чтобы потребитель/фабрика откатились на mock.
        const outputPath = `slideshow-${Date.now()}.mp4`;
        const args = buildFfmpegArgs(imageUrls, outputPath);
        await this.runFfmpeg(args);
        const result: { url: string; thumbnailUrl?: string } = { url: outputPath };
        const first = imageUrls[0];
        if (first !== undefined) {
            result.thumbnailUrl = first;
        }
        return result;
    }

    /**
     * Тонкая обёртка запуска ffmpeg как дочернего процесса. Любая недоступность
     * бинарника/ошибка кода выхода превращается в брошенное исключение —
     * обёрнуто в try/catch, чтобы не уронить процесс на ошибке spawn.
     */
    private runFfmpeg(args: string[]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const child = spawn('ffmpeg', args, { stdio: 'ignore' });
                child.on('error', (error) => reject(error));
                child.on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    } else {
                        reject(new Error(`ffmpeg завершился с кодом ${code}`));
                    }
                });
            } catch (error) {
                reject(error instanceof Error ? error : new Error(String(error)));
            }
        });
    }
}
