import type { Types } from 'mongoose';

/**
 * Базовый класс сущностей. Конкретные сущности наследуют его и помечаются
 * `@Schema({ timestamps: true })`; createdAt/updatedAt заполняет Mongoose.
 */
export abstract class BaseSchema {
    readonly _id!: Types.ObjectId;
    readonly id!: string;
    readonly createdAt!: Date;
    readonly updatedAt!: Date;
}

/** Базовые опции схем — timestamps включены везде (Foundations §15). */
export const BASE_SCHEMA_OPTIONS = { timestamps: true, versionKey: false } as const;
