import { applyDecorators, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginationMetaDto } from '../dto/pagination-meta.dto';

/** Описывает в Swagger постраничный конверт {success,data:[model],meta}. */
export const ApiPaginatedOk = <TModel extends Type>(model: TModel) =>
    applyDecorators(
        ApiExtraModels(PaginationMetaDto, model),
        ApiOkResponse({
            schema: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: getSchemaPath(model) } },
                    meta: { $ref: getSchemaPath(PaginationMetaDto) },
                },
                required: ['success', 'data', 'meta'],
            },
        }),
    );
