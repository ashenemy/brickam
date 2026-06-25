import type { AppConfigService } from '@brickam/config-kit';
import { describe, expect, it } from 'vitest';
import { createEmbeddingProvider, createLlmProvider } from './ai-kit.module';
import { AnthropicLlmProvider } from './anthropic-llm.provider';
import { MockEmbeddingProvider } from './mock-embedding.provider';
import { MockLlmProvider } from './mock-llm.provider';
import { VoyageEmbeddingProvider } from './voyage-embedding.provider';

/** Минимальный стаб AppConfigService — нужны только providers и secrets. */
function fakeConfig(opts: {
    llm: string;
    embeddings: string;
    anthropicApiKey?: string;
    voyageApiKey?: string;
}): AppConfigService {
    return {
        providers: { llm: opts.llm, embeddings: opts.embeddings },
        secrets: {
            anthropicApiKey: opts.anthropicApiKey,
            voyageApiKey: opts.voyageApiKey,
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

    it('без ключей выбираются оба mock-провайдера', () => {
        const config = fakeConfig({ llm: 'anthropic', embeddings: 'voyage' });
        expect(createLlmProvider(config)).toBeInstanceOf(MockLlmProvider);
        expect(createEmbeddingProvider(config)).toBeInstanceOf(MockEmbeddingProvider);
    });
});
