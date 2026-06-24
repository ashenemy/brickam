import type { PaginationMeta } from '@brickam/core-kit';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto implements PaginationMeta {
    @ApiProperty({ example: 1 }) page!: number;
    @ApiProperty({ example: 20 }) pageSize!: number;
    @ApiProperty({ example: 137 }) total!: number;
    @ApiProperty({ example: 7 }) totalPages!: number;
    @ApiProperty({ example: true }) hasNext!: boolean;
    @ApiProperty({ example: false }) hasPrev!: boolean;
}
