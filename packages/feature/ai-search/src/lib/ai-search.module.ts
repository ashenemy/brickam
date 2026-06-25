import { Module } from '@nestjs/common';
import { AiSearchController } from './ai-search.controller';
import { AiSearchService } from './ai-search.service';

/**
 * Модуль AI-поиска (Foundations §13, Stage 13). НЕ @Global — LLM/Embedding/
 * CatalogSearch приходят глобально по DI-токенам domain-kit (ai-kit/catalog).
 * Зависит только от kit/domain (граница feature → не импортирует другие feature).
 */
@Module({
    controllers: [AiSearchController],
    providers: [AiSearchService],
    exports: [AiSearchService],
})
export class AiSearchModule {}
