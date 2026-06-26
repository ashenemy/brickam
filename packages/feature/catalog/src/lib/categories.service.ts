import { NotFoundException } from '@brickam/core-kit';
import { BaseCrudService } from '@brickam/server-kit';
import { Injectable } from '@nestjs/common';
import type { CategoryContract } from '../@types';
import { CategoriesRepository } from './categories.repository';
import type { Category, CategoryDocument } from './category.schema';
import type { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

/**
 * Сервис категорий. Наследует CRUD-инфраструктуру и отдаёт наружу плоский
 * контракт CategoryContract (а не Mongoose-документ).
 */
@Injectable()
export class CategoriesService extends BaseCrudService<
    Category,
    CreateCategoryDto,
    UpdateCategoryDto
> {
    constructor(private readonly categoriesRepository: CategoriesRepository) {
        super(categoriesRepository);
    }

    /** Маппит документ категории в контракт. */
    private toContract(doc: CategoryDocument): CategoryContract {
        const contract: CategoryContract = {
            id: doc.id ?? doc._id.toString(),
            slug: doc.slug,
            name: { hy: doc.name.hy, ru: doc.name.ru, en: doc.name.en },
            order: doc.order,
        };
        if (doc.parentId !== undefined) {
            contract.parentId = doc.parentId;
        }
        if (doc.icon !== undefined) {
            contract.icon = doc.icon;
        }
        if (doc.calculatorType !== undefined) {
            contract.calculatorType = doc.calculatorType;
        }
        if (doc.coverUrl !== undefined) {
            contract.coverUrl = doc.coverUrl;
        }
        if (doc.featuredOnHome !== undefined) {
            contract.featuredOnHome = doc.featuredOnHome;
        }
        return contract;
    }

    /** Все категории, отсортированные по order (по возрастанию). */
    async list(): Promise<CategoryContract[]> {
        const docs = await this.categoriesRepository.find({}, { sort: { order: 1 } });
        return docs.map((doc) => this.toContract(doc));
    }

    /** Создаёт категорию и возвращает контракт. */
    async createCategory(dto: CreateCategoryDto): Promise<CategoryContract> {
        const doc = await this.categoriesRepository.create(dto as Partial<Category>);
        return this.toContract(doc);
    }

    /** Обновляет категорию по id и возвращает контракт. */
    async updateCategory(id: string, dto: UpdateCategoryDto): Promise<CategoryContract> {
        const doc = await this.categoriesRepository.updateById(id, dto as Partial<Category>);
        if (!doc) {
            throw new NotFoundException();
        }
        return this.toContract(doc);
    }
}
