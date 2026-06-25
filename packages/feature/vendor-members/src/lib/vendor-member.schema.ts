import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import { Role } from '@brickam/domain-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

/**
 * Член команды вендора (Foundations §14, Stage 15). Коллекция `vendor_members`.
 * Уникальная пара {vendorId,userId}. `permissions` — подмножество Permission;
 * фактический набор прав суб-аккаунта зеркалируется в users (setMemberAccess).
 */
@Schema(BASE_SCHEMA_OPTIONS)
export class VendorMember extends BaseSchema {
    @Prop({ type: String, required: true, index: true })
    vendorId!: string;

    @Prop({ type: String, required: true, index: true })
    userId!: string;

    @Prop({ type: String, default: Role.VendorMember })
    role!: string;

    @Prop({ type: [String], default: [] })
    permissions!: string[];
}

export type VendorMemberDocument = HydratedDocument<VendorMember>;

export const VendorMemberSchema = SchemaFactory.createForClass(VendorMember);
VendorMemberSchema.index({ vendorId: 1, userId: 1 }, { unique: true });
