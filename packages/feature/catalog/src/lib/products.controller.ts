import type { Page } from '@brickam/core-kit';
import { Permission } from '@brickam/domain-kit';
import { ApiPaginatedOk, Auth } from '@brickam/server-kit';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { ProductDetail, ProductListItem } from '../@types';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductFilterQueryDto } from './dto/product-filter-query.dto';
import { ProductDetailDto, ProductListItemDto } from './dto/response.dto';
import { ProductsService } from './products.service';
import { Public } from './public.decorator';

/** Маршруты товаров каталога (Foundations §13). Только продажа. */
@ApiTags('catalog')
@Controller('catalog/products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    /** Публичный листинг товаров с фильтрами, сортировкой и пагинацией. */
    @Get()
    @Public()
    @ApiPaginatedOk(ProductListItemDto)
    search(@Query() query: ProductFilterQueryDto): Promise<Page<ProductListItem>> {
        return this.productsService.search(query);
    }

    /** Публичная детальная карточка товара по slug. */
    @Get(':slug')
    @Public()
    @ApiOkResponse({ type: ProductDetailDto, description: 'Карточка товара' })
    getBySlug(@Param('slug') slug: string): Promise<ProductDetail> {
        return this.productsService.getBySlug(slug);
    }

    /** Создаёт товар (требует право products.manage). */
    @Post()
    @Auth(Permission.ProductsManage)
    @ApiOkResponse({ type: ProductDetailDto, description: 'Созданный товар' })
    create(@Body() dto: CreateProductDto): Promise<ProductDetail> {
        return this.productsService.create(dto) as unknown as Promise<ProductDetail>;
    }

    /** Обновляет товар по id (требует право products.manage). */
    @Patch(':id')
    @Auth(Permission.ProductsManage)
    @ApiOkResponse({ type: ProductDetailDto, description: 'Обновлённый товар' })
    update(@Param('id') id: string, @Body() dto: UpdateProductDto): Promise<ProductDetail> {
        return this.productsService.update(id, dto) as unknown as Promise<ProductDetail>;
    }

    /** Удаляет товар по id (требует право products.manage). */
    @Delete(':id')
    @Auth(Permission.ProductsManage)
    @ApiOkResponse({ description: 'Удалённый id' })
    async remove(@Param('id') id: string): Promise<{ id: string }> {
        await this.productsService.remove(id);
        return { id };
    }
}
