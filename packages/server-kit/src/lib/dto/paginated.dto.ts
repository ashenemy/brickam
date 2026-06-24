import type { Page } from '@brickam/core-kit';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from './pagination-meta.dto';

/**
 * Generic-конверт страницы. Поле data описывается в Swagger через @ApiPaginatedOk(model),
 * т.к. дженерик-параметр недоступен в рантайме.
 */
export class PaginatedDto<TData> implements Page<TData> {
    data!: TData[];

    @ApiProperty({ type: PaginationMetaDto })
    meta!: PaginationMetaDto;
}
