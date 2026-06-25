import { AppConfigService } from '@brickam/config-kit';
import { EmbeddingProvider, ImageProvider, LlmProvider, VideoProvider } from '@brickam/domain-kit';
import { Global, Module, type Provider } from '@nestjs/common';
import { AnthropicLlmProvider } from './anthropic-llm.provider';
import { FalImageProvider } from './fal-image.provider';
import { FfmpegVideoProvider } from './ffmpeg-video.provider';
import { MockEmbeddingProvider } from './mock-embedding.provider';
import { MockImageProvider } from './mock-image.provider';
import { MockLlmProvider } from './mock-llm.provider';
import { MockVideoProvider } from './mock-video.provider';
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

/**
 * Фабрика провайдера изображений: fal выбирается только если он задан в конфиге
 * И есть ключ; иначе детерминированный mock. Вынесена отдельно для юнит-теста.
 */
export function createImageProvider(config: AppConfigService): ImageProvider {
    const key = config.secrets.falApiKey;
    if (config.providers.image === 'fal' && key) {
        return new FalImageProvider(key);
    }
    return new MockImageProvider();
}

/**
 * Фабрика провайдера видео: ffmpeg выбирается только если он явно задан в
 * конфиге; иначе детерминированный mock. ffmpeg может быть недоступен в
 * окружении — там конфиг просто не указывает 'ffmpeg', и берётся mock.
 * Вынесена отдельно для юнит-теста.
 */
export function createVideoProvider(config: AppConfigService): VideoProvider {
    if (config.providers.video === 'ffmpeg') {
        return new FfmpegVideoProvider();
    }
    return new MockVideoProvider();
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

const imageProvider: Provider = {
    provide: ImageProvider,
    inject: [AppConfigService],
    useFactory: createImageProvider,
};

const videoProvider: Provider = {
    provide: VideoProvider,
    inject: [AppConfigService],
    useFactory: createVideoProvider,
};

/**
 * Глобальный модуль AI-провайдеров (Foundations §13, Stage 13/16). Реализует
 * абстракции domain-kit (Llm/Embedding/Image/Video) за DI-токенами; выбор
 * конкретной реализации — по конфигу и наличию ключа (нет ключа → mock).
 * AppConfigService приходит глобально из config-kit, поэтому forRoot не нужен.
 */
@Global()
@Module({
    providers: [llmProvider, embeddingProvider, imageProvider, videoProvider],
    exports: [LlmProvider, EmbeddingProvider, ImageProvider, VideoProvider],
})
export class AiKitModule {}
