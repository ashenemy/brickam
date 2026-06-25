import type {
    AiSearchResult,
    AiSearchThemeResult,
    LocalizedText,
    ProductSearchHit,
} from '@brickam/domain-kit';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Тело запроса AI-поиска: описание проекта свободным текстом. */
export class AiSearchDto {
    @ApiProperty({ description: 'Описание проекта свободным текстом', maxLength: 1000 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    query!: string;
}

/** Swagger-модель мультиязычного заголовка товара. */
export class LocalizedTextDto implements LocalizedText {
    @ApiProperty() hy!: string;
    @ApiProperty() ru!: string;
    @ApiProperty() en!: string;
}

/** Swagger-модель товара-результата гибридного подбора. */
export class HitDto implements ProductSearchHit {
    @ApiProperty() id!: string;
    @ApiProperty() slug!: string;
    @ApiProperty({ type: LocalizedTextDto }) title!: LocalizedText;
    @ApiProperty() finalPrice!: number;
    @ApiProperty() unit!: string;
    @ApiProperty() vendorId!: string;
    @ApiProperty() categoryId!: string;
    @ApiProperty({ required: false }) cover?: string;
}

/** Swagger-модель темы результата с пояснением и товарами. */
export class ThemeDto implements AiSearchThemeResult {
    @ApiProperty() name!: string;
    @ApiProperty() explanation!: string;
    @ApiProperty({ type: [String] }) materialCategories!: string[];
    @ApiProperty({ type: [String] }) keywords!: string[];
    @ApiProperty({ type: [HitDto] }) products!: ProductSearchHit[];
}

/** Swagger-модель результата AI-поиска, сгруппированного по темам. */
export class AiSearchResultDto implements AiSearchResult {
    @ApiProperty() projectType!: string;
    @ApiProperty({ type: [ThemeDto] }) themes!: AiSearchThemeResult[];
}
