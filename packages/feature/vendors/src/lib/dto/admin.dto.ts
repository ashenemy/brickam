import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import type { VendorStatus } from '../../@types';

/** Тело модерации вендора (одобрить/отклонить). */
export class ModerateVendorDto {
    @ApiProperty({ enum: ['approve', 'reject'] })
    @IsIn(['approve', 'reject'])
    action!: 'approve' | 'reject';
}

/** Query-фильтр админ-списка вендоров по статусу. */
export class VendorListQueryDto {
    @ApiPropertyOptional({ enum: ['active', 'suspended'] })
    @IsOptional()
    @IsIn(['active', 'suspended'])
    status?: VendorStatus;
}
