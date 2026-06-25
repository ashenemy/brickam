import { AppConfigService } from '@brickam/config-kit';
import { EmbeddingProvider, LlmProvider } from '@brickam/domain-kit';
import { Global, Module, type Provider } from '@nestjs/common';
import { AnthropicLlmProvider } from './anthropic-llm.provider';
import { MockEmbeddingProvider } from './mock-embedding.provider';
import { MockLlmProvider } from './mock-llm.provider';
import { VoyageEmbeddingProvider } from './voyage-embedding.provider';

/**
 * Фабрика LLM-провайдера: anthropic выбирается только если он задан в конфиге
 * И есть ключ; иначе детерминированный mock. Вынесена отдельно для юнит-теста.
 */
export function createLlmProvider(config: AppConfigService): LlmProvider {
    const key = config.secrets.anthropicApiKey;
    if (config.providers.llm === 'anthropic' && key) {
        return new AnthropicLlmProvider(key);
    }
    return new MockLlmProvider();
}

/**
 * Фабрика провайдера эмбеддингов: voyage только если он задан в конфиге И есть
 * ключ; иначе детерминированный mock. Вынесена отдельно для юнит-теста.
 */
export function createEmbeddingProvider(config: AppConfigService): EmbeddingProvider {
    const key = config.secrets.voyageApiKey;
    if (config.providers.embeddings === 'voyage' && key) {
        return new VoyageEmbeddingProvider(key);
    }
    return new MockEmbeddingProvider();
}

const llmProvider: Provider = {
    provide: LlmProvider,
    inject: [AppConfigService],
    useFactory: createLlmProvider,
};

const embeddingProvider: Provider = {
    provide: EmbeddingProvider,
    inject: [AppConfigService],
    useFactory: createEmbeddingProvider,
};

/**
 * Глобальный модуль AI-провайдеров (Foundations §13, Stage 13). Реализует
 * абстракции domain-kit (LlmProvider/EmbeddingProvider) за DI-токенами; выбор
 * конкретной реализации — по конфигу и наличию ключа (нет ключа → mock).
 * AppConfigService приходит глобально из config-kit, поэтому forRoot не нужен.
 */
@Global()
@Module({
    providers: [llmProvider, embeddingProvider],
    exports: [LlmProvider, EmbeddingProvider],
})
export class AiKitModule {}
