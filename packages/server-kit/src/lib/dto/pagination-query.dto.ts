import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

/** Query-параметры пагинации. maxPageSize применяется на уровне сервиса (из конфига). */
export class PaginationQueryDto {
    @ApiPropertyOptional({ minimum: 1, default: 1, description: 'Номер страницы (1-based)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;

    @ApiPropertyOptional({ minimum: 1, default: 20, description: 'Размер страницы' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pageSize = 20;
}
