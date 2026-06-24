import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Template, type TemplateDocument } from './template.schema';

/** Репозиторий шаблонов поверх Mongoose-модели Template (Foundations §7). */
@Injectable()
export class TemplatesRepository extends BaseRepository<Template> {
    constructor(@InjectModel(Template.name) model: Model<Template>) {
        super(model);
    }

    /** Находит шаблон по ключу (уникальный индекс). */
    findByKey(key: string): Promise<TemplateDocument | null> {
        return this.findOne({ key });
    }
}
