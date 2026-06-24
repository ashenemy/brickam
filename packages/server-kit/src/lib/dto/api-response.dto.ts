import type { SuccessEnvelope } from '@brickam/core-kit';
import { ApiProperty } from '@nestjs/swagger';

/** Swagger-модель конверта успеха {success:true, data}. */
export class ApiResponseDto<TData> implements Omit<SuccessEnvelope<TData>, 'meta'> {
    @ApiProperty({ example: true })
    success!: true;

    data!: TData;
}
