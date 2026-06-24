import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
    CategoryContract,
    Discount,
    MediaDescriptor,
    ProductAttribute,
    ProductDetail,
    ProductListItem,
    ProductStatus,
} from '../../@types';
import { AttributeDto, DiscountDto, LocalizedTextDto, MediaDto } from './media.dto';

/** Swagger-модель элемента листинга товаров. */
export class ProductListItemDto implements ProductListItem {
    @ApiProperty() id!: string;
    @ApiProperty() slug!: string;
    @ApiProperty() vendorId!: string;
    @ApiProperty() categoryId!: string;
    @ApiProperty({ type: LocalizedTextDto }) title!: LocalizedTextDto;
    @ApiProperty({ type: MediaDto }) cover!: MediaDescriptor;
    @ApiProperty() price!: number;
    @ApiPropertyOptional({ type: DiscountDto }) discount?: Discount;
    @ApiProperty() finalPrice!: number;
    @ApiProperty() unit!: string;
    @ApiProperty() stock!: number;
    @ApiProperty() region!: string;
    @ApiProperty() ratingAvg!: number;
    @ApiProperty() ratingCount!: number;
}

/** Swagger-модель детальной карточки товара. */
export class ProductDetailDto extends ProductListItemDto implements ProductDetail {
    @ApiProperty({ type: LocalizedTextDto }) description!: LocalizedTextDto;
    @ApiProperty({ type: [MediaDto] }) gallery!: MediaDescriptor[];
    @ApiProperty({ type: [AttributeDto] }) attributes!: ProductAttribute[];
    @ApiProperty({ enum: ['draft', 'active', 'hidden'] }) status!: ProductStatus;
    @ApiProperty() viewsCount!: number;
}

/** Swagger-модель категории. */
export class CategoryDto implements CategoryContract {
    @ApiProperty() id!: string;
    @ApiProperty() slug!: string;
    @ApiPropertyOptional() parentId?: string;
    @ApiProperty({ type: LocalizedTextDto }) name!: LocalizedTextDto;
    @ApiPropertyOptional() icon?: string;
    @ApiProperty() order!: number;
    @ApiPropertyOptional() calculatorType?: string;
}
