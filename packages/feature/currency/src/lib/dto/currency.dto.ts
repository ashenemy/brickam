import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';
import type { ConversionView, DisplayCurrenciesView, RateView } from '../../@types';

/** Query-параметры конвертации суммы из AMD в валюту отображения. */
export class ConvertQueryDto {
    @ApiProperty({ description: 'Сумма в AMD (база расчётов)' })
    @IsNumber()
    amount!: number;

    @ApiProperty({ description: 'Код целевой валюты отображения (USD/EUR/RUB)' })
    @IsString()
    @IsNotEmpty()
    @Length(3, 3)
    to!: string;
}

/** Swagger-модель курса валюты (AMD за 1 единицу). */
export class RateDto implements RateView {
    @ApiProperty({ description: 'Код валюты' }) currency!: string;
    @ApiProperty({ description: 'Сколько AMD за 1 единицу валюты' }) rate!: number;
    @ApiProperty({ description: 'Момент фиксации курса' }) fetchedAt!: Date;
}

/** Swagger-модель списка отображаемых валют относительно базовой. */
export class DisplayCurrenciesDto implements DisplayCurrenciesView {
    @ApiProperty({ description: 'Базовая валюта расчётов' }) base!: string;
    @ApiProperty({ description: 'Валюты отображения', type: [String] }) currencies!: string[];
}

/** Swagger-модель результата конвертации из AMD. */
export class ConversionDto implements ConversionView {
    @ApiProperty({ description: 'Исходная сумма в AMD' }) amount!: number;
    @ApiProperty({ description: 'Целевая валюта' }) currency!: string;
    @ApiProperty({ description: 'Сконвертированная сумма (round2)' }) converted!: number;
}
