import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Page, type PageDocument } from './page.schema';

/** Репозиторий статических страниц поверх Mongoose-модели Page (Foundations §7). */
@Injectable()
export class PagesRepository extends BaseRepository<Page> {
    constructor(@InjectModel(Page.name) model: Model<Page>) {
        super(model);
    }

    /** Находит страницу по уникальному slug (любой статус). */
    findBySlug(slug: string): Promise<PageDocument | null> {
        return this.findOne({ slug });
    }

    /** Опубликованные страницы (для меню/футера). */
    findPublished(): Promise<PageDocument[]> {
        return this.find({ status: 'published' }, { sort: { slug: 1 } });
    }
}
