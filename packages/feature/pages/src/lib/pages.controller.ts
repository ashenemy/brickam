import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { PageContract } from '../@types';
import { PageDto } from './dto/page.dto';
import { PagesService } from './pages.service';
import { Public } from './public.decorator';

/** Публичные маршруты статических страниц (Foundations §15). */
@ApiTags('pages')
@Controller('pages')
export class PagesController {
    constructor(private readonly pagesService: PagesService) {}

    /** Список опубликованных страниц (для меню/футера). */
    @Get()
    @Public()
    @ApiOkResponse({ type: [PageDto], description: 'Опубликованные страницы' })
    listPublished(): Promise<PageContract[]> {
        return this.pagesService.listPublished();
    }

    /** Опубликованная страница по slug. */
    @Get(':slug')
    @Public()
    @ApiOkResponse({ type: PageDto, description: 'Опубликованная страница' })
    getPublished(@Param('slug') slug: string): Promise<PageContract> {
        return this.pagesService.getPublished(slug);
    }
}
