import { Auth } from '@brickam/server-kit';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { CategoryContract } from '../@types';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CategoryDto } from './dto/response.dto';
import { Public } from './public.decorator';

/** Маршруты категорий каталога (Foundations §13). */
@ApiTags('catalog')
@Controller('catalog/categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) {}

    /** Публичный список категорий (сортировка по order). */
    @Get()
    @Public()
    @ApiOkResponse({ type: [CategoryDto], description: 'Список категорий' })
    list(): Promise<CategoryContract[]> {
        return this.categoriesService.list();
    }

    /** Создаёт категорию (требует аутентификации). */
    @Post()
    @Auth()
    @ApiOkResponse({ type: CategoryDto, description: 'Созданная категория' })
    create(@Body() dto: CreateCategoryDto): Promise<CategoryContract> {
        return this.categoriesService.createCategory(dto);
    }

    /** Обновляет категорию по id. */
    @Patch(':id')
    @Auth()
    @ApiOkResponse({ type: CategoryDto, description: 'Обновлённая категория' })
    update(@Param('id') id: string, @Body() dto: UpdateCategoryDto): Promise<CategoryContract> {
        return this.categoriesService.updateCategory(id, dto);
    }

    /** Удаляет категорию по id. */
    @Delete(':id')
    @Auth()
    @ApiOkResponse({ description: 'Удалённый id' })
    async remove(@Param('id') id: string): Promise<{ id: string }> {
        await this.categoriesService.remove(id);
        return { id };
    }
}
