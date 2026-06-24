import type { AttributeDto } from './attributeDto';
import type { DiscountDto } from './discountDto';
import type { LocalizedTextDto } from './localizedTextDto';
import type { MediaDto } from './mediaDto';

export interface UpdateProductDto {
  vendorId?: string;
  categoryId?: string;
  /** Уникальный slug товара */
  slug?: string;
  title?: LocalizedTextDto;
  description?: LocalizedTextDto;
  cover?: MediaDto;
  gallery?: MediaDto[];
  /** Базовая цена (целые AMD) */
  price?: number;
  discount?: DiscountDto;
  /** Единица измерения */
  unit?: string;
  /** Остаток на складе */
  stock?: number;
  /** Регион */
  region?: string;
  attributes?: AttributeDto[];
}
