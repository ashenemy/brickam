import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Product, type ProductDocument } from './product.schema';

/** Репозиторий товаров поверх Mongoose-модели Product (Foundations §7). */
@Injectable()
export class ProductsRepository extends BaseRepository<Product> {
    constructor(@InjectModel(Product.name) model: Model<Product>) {
        super(model);
    }

    /** Находит товар по slug (уникальный индекс). */
    findBySlug(slug: string): Promise<ProductDocument | null> {
        return this.findOne({ slug });
    }

    /** Инкрементирует счётчик просмотров товара. */
    async incrementViews(id: string): Promise<void> {
        await this.updateById(id, { $inc: { viewsCount: 1 } } as never);
    }
}
