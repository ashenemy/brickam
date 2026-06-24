import { Body, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import type { BaseCrudService } from './base-crud.service';

/**
 * Абстрактный CRUD-контроллер (Foundations §7). Конкретный контроллер
 * наследует его, помечает @Controller/@ApiTags и при необходимости
 * переопределяет create/update с конкретными DTO для валидации.
 */
export abstract class BaseCrudController<TEntity, TCreate, TUpdate> {
    protected constructor(protected readonly service: BaseCrudService<TEntity, TCreate, TUpdate>) {}

    @Get()
    findAll(@Query() query: PaginationQueryDto) {
        return this.service.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Post()
    create(@Body() dto: TCreate) {
        return this.service.create(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: TUpdate) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<{ id: string }> {
        await this.service.remove(id);
        return { id };
    }
}
