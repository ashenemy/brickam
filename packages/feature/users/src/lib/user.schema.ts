import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import { AccountType, Permission, Role, UserStatus } from '@brickam/domain-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Exclude } from 'class-transformer';
import type { HydratedDocument } from 'mongoose';
import type { UserLoyalty } from '../@types';

/** Вложенная сводка по лояльности пользователя (Foundations §15). */
@Schema({ _id: false })
export class UserLoyaltyEmbedded implements UserLoyalty {
    @Prop({ type: String, required: false })
    currentTierId?: string;

    @Prop({ type: Number, default: 0 })
    totalSpend!: number;

    @Prop({ type: Number, default: 0 })
    totalOrders!: number;
}

const UserLoyaltySchema = SchemaFactory.createForClass(UserLoyaltyEmbedded);

/**
 * Сущность пользователя (Foundations §15). Хранит хеш пароля для auth
 * (`@Exclude` прячет его при сериализации наружу; `select` не трогаем — auth
 * должен читать хеш при логине).
 */
@Schema(BASE_SCHEMA_OPTIONS)
export class User extends BaseSchema {
    @Prop({ type: String, enum: Role, required: true })
    role!: Role;

    @Prop({ type: String, enum: AccountType, required: false })
    accountType?: AccountType;

    @Prop({ type: String, required: true })
    name!: string;

    @Prop({ type: String, required: true, unique: true, index: true })
    phone!: string;

    @Prop({ type: Boolean, default: false })
    phoneVerified!: boolean;

    @Exclude()
    @Prop({ type: String, required: true })
    passwordHash!: string;

    @Prop({ type: String, default: 'hy' })
    lang!: string;

    @Prop({ type: String, enum: UserStatus, default: UserStatus.Active })
    status!: UserStatus;

    @Prop({ type: String, required: false })
    vendorId?: string;

    @Prop({ type: [String], enum: Permission, required: false })
    permissions?: Permission[];

    @Prop({ type: UserLoyaltySchema, default: () => ({ totalSpend: 0, totalOrders: 0 }) })
    loyalty!: UserLoyalty;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);
