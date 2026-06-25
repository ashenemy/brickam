import { spawn } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { VideoProvider } from '@brickam/domain-kit';

/** Длительность показа одного кадра в слайдшоу (сек). */
const FRAME_DURATION_SEC = 2;
/** Частота кадров результирующего ролика. */
const OUTPUT_FPS = 25;

/**
 * Строит массив аргументов ffmpeg для слайдшоу из набора фото (чистая функция,
 * без побочных эффектов — её и тестируем). Каждый кадр показывается
 * FRAME_DURATION_SEC секунд; вход — список локальных путей картинок, выход —
 * путь до mp4.
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
 * Провайдер видео на ffmpeg (Foundations §13): собирает слайдшоу из фото.
 * Скачивает `imageUrls` во временную папку, прогоняет системный `ffmpeg`
 * (child_process) с аргументами из {@link buildFfmpegArgs}, возвращает путь к
 * сгенерированному mp4. Выбирается фабрикой ai-kit при `providers.video='ffmpeg'`
 * (нужен бинарь ffmpeg в образе); иначе берётся mock. Выгрузку результата в
 * хранилище и уборку временной папки делает вызывающий код (граница kit→feature).
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

        const workDir = await this.makeWorkDir();
        const localPaths: string[] = [];
        for (let index = 0; index < imageUrls.length; index += 1) {
            const dest = join(workDir, `frame-${index}`);
            await this.fetchToFile(imageUrls[index] as string, dest);
            localPaths.push(dest);
        }

        const outputPath = join(workDir, 'slideshow.mp4');
        await this.runFfmpeg(buildFfmpegArgs(localPaths, outputPath));

        const result: { url: string; thumbnailUrl?: string } = { url: outputPath };
        const first = imageUrls[0];
        if (first !== undefined) {
            result.thumbnailUrl = first;
        }
        return result;
    }

    /** Создаёт изолированную временную папку под кадры и результат. */
    protected makeWorkDir(): Promise<string> {
        return mkdtemp(join(tmpdir(), 'bh-slideshow-'));
    }

    /** Скачивает URL и сохраняет в локальный файл (для входа ffmpeg). */
    protected async fetchToFile(url: string, dest: string): Promise<void> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(
                `ffmpeg slideshow: не удалось скачать ${url} (HTTP ${response.status})`,
            );
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        await writeFile(dest, buffer);
    }

    /**
     * Тонкая обёртка запуска ffmpeg как дочернего процесса. Недоступность
     * бинарника/ненулевой код выхода превращается в брошенное исключение.
     */
    protected runFfmpeg(args: string[]): Promise<void> {
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
