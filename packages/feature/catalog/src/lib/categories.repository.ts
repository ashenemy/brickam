import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Category, type CategoryDocument } from './category.schema';

/** Репозиторий категорий поверх Mongoose-модели Category (Foundations §7). */
@Injectable()
export class CategoriesRepository extends BaseRepository<Category> {
    constructor(@InjectModel(Category.name) model: Model<Category>) {
        super(model);
    }

    /** Находит категорию по slug (уникальный индекс). */
    findBySlug(slug: string): Promise<CategoryDocument | null> {
        return this.findOne({ slug });
    }
}
