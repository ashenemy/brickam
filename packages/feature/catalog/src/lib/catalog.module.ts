import { CatalogServiceContract } from '@brickam/domain-kit';
import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesController } from './categories.controller';
import { CategoriesRepository } from './categories.repository';
import { CategoriesService } from './categories.service';
import { Category, CategorySchema } from './category.schema';
import { MediaValidator } from './media-validator';
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
        CategoriesService,
        ProductsService,
        PlatformSettingsService,
        MediaValidator,
        // Контракт для orders: catalog отдаёт снимок товара и списывает остаток.
        { provide: CatalogServiceContract, useExisting: ProductsService },
    ],
    exports: [ProductsService, CategoriesService, CatalogServiceContract],
})
export class CatalogModule {}
