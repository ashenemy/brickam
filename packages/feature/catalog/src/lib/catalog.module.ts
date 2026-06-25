import {
    CatalogBulkContract,
    CatalogSearchContract,
    CatalogServiceContract,
    PlatformSettingsContract,
    ProductMediaContract,
} from '@brickam/domain-kit';
import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogAiService } from './catalog-ai.service';
import { CategoriesController } from './categories.controller';
import { CategoriesRepository } from './categories.repository';
import { CategoriesService } from './categories.service';
import { Category, CategorySchema } from './category.schema';
import { MediaValidator } from './media-validator';
import { PlatformSettingsRepository } from './platform-settings.repository';
import { PlatformSettings, PlatformSettingsSchema } from './platform-settings.schema';
import { PlatformSettingsService } from './platform-settings.service';
import { Product, ProductSchema } from './product.schema';
import { ProductsController } from './products.controller';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';

/**
 * Модуль каталога (Foundations §13). Категории + товары (только продажа),
 * медиа-валидация против лимитов платформы. Зависит только от kit/domain.
 */
@Global()
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Category.name, schema: CategorySchema },
            { name: Product.name, schema: ProductSchema },
            { name: PlatformSettings.name, schema: PlatformSettingsSchema },
        ]),
    ],
    controllers: [CategoriesController, ProductsController],
    providers: [
        CategoriesRepository,
        ProductsRepository,
        PlatformSettingsRepository,
        CategoriesService,
        ProductsService,
        PlatformSettingsService,
        CatalogAiService,
        MediaValidator,
        // Контракт для orders: catalog отдаёт снимок товара и списывает остаток.
        { provide: CatalogServiceContract, useExisting: ProductsService },
        // Контракт поиска для ai-search: keyword + vector подбор товаров (§13).
        { provide: CatalogSearchContract, useExisting: ProductsService },
        // Контракт массовых операций для vendor-bulk: проекции + точечные апдейты (§14).
        { provide: CatalogBulkContract, useExisting: ProductsService },
        // Контракты настроек/медиа для ai-assistant: промпты + контекст/обложка (§13/§16).
        { provide: PlatformSettingsContract, useExisting: CatalogAiService },
        { provide: ProductMediaContract, useExisting: CatalogAiService },
    ],
    exports: [
        ProductsService,
        CategoriesService,
        CatalogServiceContract,
        CatalogSearchContract,
        CatalogBulkContract,
        PlatformSettingsContract,
        ProductMediaContract,
    ],
})
export class CatalogModule {}
