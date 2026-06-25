import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsObject } from 'class-validator';

/** Тело сохранения произвольной настройки платформы (PUT /admin/settings/:key). */
export class SaveSettingDto {
    @ApiProperty({ type: Object, description: 'Произвольный JSON настройки' })
    @IsObject()
    value!: Record<string, unknown>;
}

/** Тело модерации (одобрить/отклонить товар или вендора). */
export class ModerateDto {
    @ApiProperty({ enum: ['approve', 'reject'] })
    @IsIn(['approve', 'reject'])
    action!: 'approve' | 'reject';
}
