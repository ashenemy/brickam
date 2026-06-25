import { Public } from '@brickam/auth';
import { Controller, Get, Header } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SeoService } from './seo.service';

/**
 * Служебные SEO-эндпоинты на корне API (`/api/sitemap.xml`, `/api/robots.txt`).
 * Контроллер без префикса версии: при глобальном URI-версионировании
 * `defaultVersion` включает VERSION_NEUTRAL, поэтому пути остаются доступны на
 * `/<globalPrefix>/...` без сегмента версии. Публичные и вне rate-limit
 * (краулеры опрашивают часто).
 */
@SkipThrottle()
@ApiTags('seo')
@Controller()
export class SeoController {
    constructor(private readonly seo: SeoService) {}

    /** XML-карта сайта: статика + опубликованные страницы + товары. */
    @Public()
    @Get('sitemap.xml')
    @Header('Content-Type', 'application/xml')
    @ApiOkResponse({ description: 'XML-карта сайта (sitemap.xml)' })
    sitemap(): Promise<string> {
        return this.seo.generateSitemap();
    }

    /** robots.txt со ссылкой на карту сайта. */
    @Public()
    @Get('robots.txt')
    @Header('Content-Type', 'text/plain')
    @ApiOkResponse({ description: 'robots.txt' })
    robots(): string {
        return this.seo.generateRobots();
    }
}
