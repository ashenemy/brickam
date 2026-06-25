import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

/**
 * Query-параметры периода аналитики. `from`/`to` — ISO-8601 (опц.); при
 * отсутствии контроллер подставляет последние 30 дней.
 */
export class AnalyticsQueryDto {
    @ApiPropertyOptional({ description: 'Начало периода (ISO-8601)' })
    @IsOptional()
    @IsISO8601()
    from?: string;

    @ApiPropertyOptional({ description: 'Конец периода (ISO-8601)' })
    @IsOptional()
    @IsISO8601()
    to?: string;
}
