import { Prop } from '@nestjs/mongoose';
import { Types } from 'mongoose';

/**
 * Базовый класс сущностей. Конкретные сущности наследуют его и помечаются
 * `@Schema({ timestamps: true })`; createdAt/updatedAt заполняет Mongoose.
 *
 * `_id` — СТРОКА: весь домен и сид используют стабильные строковые идентификаторы
 * (например 'cat_<slug>', 'prod_<slug>', 'vendor_<slug>'), а ссылки между
 * сущностями (vendorId/categoryId/…) — тоже строки. Для сущностей, создаваемых
 * сервисами в рантайме (без явного _id), генерируется hex ObjectId как строка.
 */
export abstract class BaseSchema {
    @Prop({ type: String, default: () => new Types.ObjectId().toHexString() })
    _id!: string;

    readonly id!: string;
    readonly createdAt!: Date;
    readonly updatedAt!: Date;
}

/** Базовые опции схем — timestamps включены везде (Foundations §15). */
export const BASE_SCHEMA_OPTIONS = { timestamps: true, versionKey: false } as const;
