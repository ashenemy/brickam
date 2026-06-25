import { EventEmitter } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildFfmpegArgs, FfmpegVideoProvider } from './ffmpeg-video.provider';

// Мокаем child_process: реальный ffmpeg в тестах не запускается.
const spawnMock = vi.fn();
vi.mock('node:child_process', () => ({
    spawn: (...args: unknown[]) => spawnMock(...args),
}));

describe('buildFfmpegArgs (без запуска ffmpeg)', () => {
    it('строит вход -i на каждое фото с loop/длительностью', () => {
        const args = buildFfmpegArgs(['/tmp/1.png', '/tmp/2.png'], '/tmp/out.mp4');
        expect(args).toEqual([
            '-loop',
            '1',
            '-t',
            '2',
            '-i',
            '/tmp/1.png',
            '-loop',
            '1',
            '-t',
            '2',
            '-i',
            '/tmp/2.png',
            '-filter_complex',
            '[0:v][1:v]concat=n=2:v=1:a=0[v]',
            '-map',
            '[v]',
            '-r',
            '25',
            '-pix_fmt',
            'yuv420p',
            '-y',
            '/tmp/out.mp4',
        ]);
    });

    it('последний аргумент — путь вывода', () => {
        const args = buildFfmpegArgs(['/a.png'], '/out.mp4');
        expect(args[args.length - 1]).toBe('/out.mp4');
        expect(args).toContain('-filter_complex');
    });
});

describe('FfmpegVideoProvider (spawn/скачивание замоканы)', () => {
    afterEach(() => {
        spawnMock.mockReset();
        vi.restoreAllMocks();
    });

    type Internals = {
        makeWorkDir(): Promise<string>;
        fetchToFile(url: string, dest: string): Promise<void>;
    };

    // Провайдер без реальных сети/ФС: подменяем makeWorkDir/fetchToFile, реальным
    // остаётся только runFfmpeg (через замоканный spawn).
    const makeProvider = (fetchImpl?: (url: string, dest: string) => Promise<void>) => {
        const provider = new FfmpegVideoProvider();
        vi.spyOn(provider as unknown as Internals, 'makeWorkDir').mockResolvedValue('/work');
        vi.spyOn(provider as unknown as Internals, 'fetchToFile').mockImplementation(
            fetchImpl ?? (async () => {}),
        );
        return provider;
    };

    it('имеет имя ffmpeg', () => {
        expect(new FfmpegVideoProvider().name).toBe('ffmpeg');
    });

    it('нет входных фото → ошибка без запуска spawn', async () => {
        await expect(new FfmpegVideoProvider().slideshow([], 'p')).rejects.toThrow(
            /нет входных изображений/,
        );
        expect(spawnMock).not.toHaveBeenCalled();
    });

    it('скачивает каждое фото и при коде 0 → url(.mp4) + thumbnailUrl (первое)', async () => {
        spawnMock.mockImplementation(() => {
            const child = new EventEmitter();
            queueMicrotask(() => child.emit('close', 0));
            return child;
        });
        const provider = makeProvider();
        const fetchSpy = (provider as unknown as Internals).fetchToFile as ReturnType<typeof vi.fn>;

        const result = await provider.slideshow(['a.png', 'b.png'], 'p');

        expect(fetchSpy).toHaveBeenCalledTimes(2); // скачаны оба фото
        expect(result.url).toMatch(/\.mp4$/);
        expect(result.thumbnailUrl).toBe('a.png');
        expect(spawnMock).toHaveBeenCalledWith('ffmpeg', expect.any(Array), expect.any(Object));
    });

    it('ошибка скачивания фото → проброс, ffmpeg не запускается', async () => {
        const provider = makeProvider(async () => {
            throw new Error('HTTP 404');
        });
        await expect(provider.slideshow(['a.png'], 'p')).rejects.toThrow(/HTTP 404/);
        expect(spawnMock).not.toHaveBeenCalled();
    });

    it('ненулевой код выхода → ошибка', async () => {
        spawnMock.mockImplementation(() => {
            const child = new EventEmitter();
            queueMicrotask(() => child.emit('close', 1));
            return child;
        });
        await expect(makeProvider().slideshow(['a.png'], 'p')).rejects.toThrow(/кодом 1/);
    });

    it('ошибка spawn (нет ffmpeg) → проброс ошибки', async () => {
        spawnMock.mockImplementation(() => {
            const child = new EventEmitter();
            queueMicrotask(() => child.emit('error', new Error('ENOENT')));
            return child;
        });
        await expect(makeProvider().slideshow(['a.png'], 'p')).rejects.toThrow(/ENOENT/);
    });
});
