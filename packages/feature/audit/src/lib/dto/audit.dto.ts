import { ApiProperty } from '@nestjs/swagger';
import type { AuditLogView } from '../../@types';

/** Swagger-модель записи аудит-лога (публичный контракт). */
export class AuditLogDto implements AuditLogView {
    @ApiProperty() id!: string;
    @ApiProperty() actorId!: string;
    @ApiProperty() action!: string;
    @ApiProperty({ required: false }) targetType?: string;
    @ApiProperty({ required: false }) targetId?: string;
    @ApiProperty({ required: false, type: Object }) meta?: Record<string, unknown>;
    @ApiProperty() at!: Date;
    @ApiProperty() createdAt!: Date;
    @ApiProperty() updatedAt!: Date;
}
