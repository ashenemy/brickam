import type { AppConfigService } from '@brickam/config-kit';
import { describe, expect, it } from 'vitest';
import {
    createEmbeddingProvider,
    createImageProvider,
    createLlmProvider,
    createVideoProvider,
} from './ai-kit.module';
import { AnthropicLlmProvider } from './anthropic-llm.provider';
import { FalImageProvider } from './fal-image.provider';
import { FfmpegVideoProvider } from './ffmpeg-video.provider';
import { MockEmbeddingProvider } from './mock-embedding.provider';
import { MockImageProvider } from './mock-image.provider';
import { MockLlmProvider } from './mock-llm.provider';
import { MockVideoProvider } from './mock-video.provider';
import { VoyageEmbeddingProvider } from './voyage-embedding.provider';

/** Минимальный стаб AppConfigService — нужны только providers и secrets. */
function fakeConfig(opts: {
    llm: string;
    embeddings: string;
    image?: string;
    video?: string;
    anthropicApiKey?: string;
    voyageApiKey?: string;
    falApiKey?: string;
}): AppConfigService {
    return {
        providers: {
            llm: opts.llm,
            embeddings: opts.embeddings,
            image: opts.image ?? 'fal',
            video: opts.video ?? 'ffmpeg',
        },
        secrets: {
            anthropicApiKey: opts.anthropicApiKey,
            voyageApiKey: opts.voyageApiKey,
            falApiKey: opts.falApiKey,
        },
    } as unknown as AppConfigService;
}

describe('ai-kit фабрики провайдеров (Foundations §13)', () => {
    describe('createLlmProvider', () => {
        it('anthropic + ключ → AnthropicLlmProvider', () => {
            const p = createLlmProvider(
                fakeConfig({ llm: 'anthropic', embeddings: 'voyage', anthropicApiKey: 'sk-test' }),
            );
            expect(p).toBeInstanceOf(AnthropicLlmProvider);
            expect(p.name).toBe('anthropic');
        });

        it('anthropic, но без ключа → MockLlmProvider', () => {
            const p = createLlmProvider(fakeConfig({ llm: 'anthropic', embeddings: 'voyage' }));
            expect(p).toBeInstanceOf(MockLlmProvider);
            expect(p.name).toBe('mock');
        });

        it('провайдер не anthropic → MockLlmProvider даже с ключом', () => {
            const p = createLlmProvider(
                fakeConfig({ llm: 'mock', embeddings: 'voyage', anthropicApiKey: 'sk-test' }),
            );
            expect(p).toBeInstanceOf(MockLlmProvider);
        });
    });

    describe('createEmbeddingProvider', () => {
        it('voyage + ключ → VoyageEmbeddingProvider', () => {
            const p = createEmbeddingProvider(
                fakeConfig({ llm: 'anthropic', embeddings: 'voyage', voyageApiKey: 'pa-test' }),
            );
            expect(p).toBeInstanceOf(VoyageEmbeddingProvider);
            expect(p.name).toBe('voyage');
        });

        it('voyage, но без ключа → MockEmbeddingProvider', () => {
            const p = createEmbeddingProvider(
                fakeConfig({ llm: 'anthropic', embeddings: 'voyage' }),
            );
            expect(p).toBeInstanceOf(MockEmbeddingProvider);
            expect(p.name).toBe('mock');
        });

        it('провайдер не voyage → MockEmbeddingProvider даже с ключом', () => {
            const p = createEmbeddingProvider(
                fakeConfig({ llm: 'anthropic', embeddings: 'mock', voyageApiKey: 'pa-test' }),
            );
            expect(p).toBeInstanceOf(MockEmbeddingProvider);
        });
    });

    describe('createImageProvider', () => {
        it('fal + ключ → FalImageProvider', () => {
            const p = createImageProvider(
                fakeConfig({
                    llm: 'mock',
                    embeddings: 'mock',
                    image: 'fal',
                    falApiKey: 'fal-test',
                }),
            );
            expect(p).toBeInstanceOf(FalImageProvider);
            expect(p.name).toBe('fal');
        });

        it('fal, но без ключа → MockImageProvider', () => {
            const p = createImageProvider(
                fakeConfig({ llm: 'mock', embeddings: 'mock', image: 'fal' }),
            );
            expect(p).toBeInstanceOf(MockImageProvider);
            expect(p.name).toBe('mock');
        });

        it('провайдер не fal → MockImageProvider даже с ключом', () => {
            const p = createImageProvider(
                fakeConfig({
                    llm: 'mock',
                    embeddings: 'mock',
                    image: 'mock',
                    falApiKey: 'fal-test',
                }),
            );
            expect(p).toBeInstanceOf(MockImageProvider);
        });
    });

    describe('createVideoProvider', () => {
        it('ffmpeg → FfmpegVideoProvider', () => {
            const p = createVideoProvider(
                fakeConfig({ llm: 'mock', embeddings: 'mock', video: 'ffmpeg' }),
            );
            expect(p).toBeInstanceOf(FfmpegVideoProvider);
            expect(p.name).toBe('ffmpeg');
        });

        it('не ffmpeg → MockVideoProvider', () => {
            const p = createVideoProvider(
                fakeConfig({ llm: 'mock', embeddings: 'mock', video: 'mock' }),
            );
            expect(p).toBeInstanceOf(MockVideoProvider);
            expect(p.name).toBe('mock');
        });
    });

    it('без ключей выбираются mock llm/embedding/image, ffmpeg-видео по конфигу', () => {
        const config = fakeConfig({ llm: 'anthropic', embeddings: 'voyage', image: 'fal' });
        expect(createLlmProvider(config)).toBeInstanceOf(MockLlmProvider);
        expect(createEmbeddingProvider(config)).toBeInstanceOf(MockEmbeddingProvider);
        expect(createImageProvider(config)).toBeInstanceOf(MockImageProvider);
    });
});
