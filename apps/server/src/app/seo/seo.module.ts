import { AppConfigService } from '@brickam/config-kit';
import { PagesModule } from '@brickam/pages';
import { Module } from '@nestjs/common';
import { loadSeoConfig, SEO_CONFIG, type SeoConfig } from './seo.config';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';

/**
 * Модуль SEO-инфраструктуры (sitemap.xml + robots.txt). `ProductsService`
 * приходит глобально из `CatalogModule` (@Global); `PagesService` —
 * импортом `PagesModule`. Конфиг (базовый URL из env SITE_URL + globalPrefix
 * из AppConfigService) собирается фабрикой.
 */
@Module({
    imports: [PagesModule],
    controllers: [SeoController],
    providers: [
        SeoService,
        {
            provide: SEO_CONFIG,
            inject: [AppConfigService],
            useFactory: (config: AppConfigService): SeoConfig =>
                loadSeoConfig(process.env, config.server.globalPrefix),
        },
    ],
})
export class SeoModule {}
