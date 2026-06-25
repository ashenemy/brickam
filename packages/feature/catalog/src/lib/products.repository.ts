import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, PipelineStage } from 'mongoose';
import { Product, type ProductDocument } from './product.schema';

/** Репозиторий товаров поверх Mongoose-модели Product (Foundations §7). */
@Injectable()
export class ProductsRepository extends BaseRepository<Product> {
    constructor(@InjectModel(Product.name) private readonly productModel: Model<Product>) {
        super(productModel);
    }

    /** Находит товар по slug (уникальный индекс). */
    findBySlug(slug: string): Promise<ProductDocument | null> {
        return this.findOne({ slug });
    }

    /** Инкрементирует счётчик просмотров товара. */
    async incrementViews(id: string): Promise<void> {
        await this.updateById(id, { $inc: { viewsCount: 1 } } as never);
    }

    /**
     * Поиск товаров по произвольному фильтру с ограничением кол-ва (для AI
     * keyword-поиска). Лимит применяется в БД, чтобы не тянуть лишнее.
     */
    findLimited(filter: Record<string, unknown>, limit: number): Promise<ProductDocument[]> {
        return (this.productModel as Model<Product>)
            .find(filter as never)
            .limit(limit)
            .exec();
    }

    /**
     * Произвольный aggregation pipeline (нужен для $vectorSearch на Atlas).
     * Возвращает «сырые» документы; маппинг — на стороне сервиса.
     */
    aggregate(pipeline: PipelineStage[]): Promise<ProductDocument[]> {
        return this.productModel.aggregate<ProductDocument>(pipeline).exec();
    }

    /**
     * Точечно обновляет товар ТОЛЬКО если он принадлежит вендору (фильтр по
     * `vendorId`) — для массовых операций (Foundations §14). `set` идёт в `$set`,
     * `unset` (если есть) в `$unset`. Возвращает кол-во фактически изменённых
     * документов (0 — чужой/несуществующий товар или без изменений).
     */
    async updateOwned(
        productId: string,
        vendorId: string,
        set: Record<string, unknown>,
        unset?: Record<string, unknown>,
    ): Promise<number> {
        const update: Record<string, unknown> = {};
        if (Object.keys(set).length > 0) {
            update['$set'] = set;
        }
        if (unset && Object.keys(unset).length > 0) {
            update['$unset'] = unset;
        }
        if (Object.keys(update).length === 0) {
            return 0;
        }
        const result = await this.productModel
            .updateOne({ _id: productId, vendorId } as never, update)
            .exec();
        return result.modifiedCount;
    }
}
