import type { AiSearchResult } from '@brickam/domain-kit';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AiSearchService } from './ai-search.service';
import { AiSearchDto, AiSearchResultDto } from './dto/ai-search.dto';
import { Public } from './public.decorator';

/** Маршруты AI-поиска по описанию проекта (Foundations §13, Stage 13). */
@ApiTags('ai')
@Controller('ai')
export class AiSearchController {
    constructor(private readonly aiSearchService: AiSearchService) {}

    /** Подбирает материалы по описанию проекта, сгруппированные по темам. */
    @Post('search')
    @Public()
    @ApiOkResponse({ type: AiSearchResultDto, description: 'Результат AI-поиска по темам' })
    search(@Body() dto: AiSearchDto): Promise<AiSearchResult> {
        return this.aiSearchService.search(dto.query);
    }
}
