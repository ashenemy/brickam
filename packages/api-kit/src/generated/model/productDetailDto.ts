import type { AttributeDto } from './attributeDto';
import type { DiscountDto } from './discountDto';
import type { LocalizedTextDto } from './localizedTextDto';
import type { MediaDto } from './mediaDto';
import type { ProductDetailDtoStatus } from './productDetailDtoStatus';

export interface ProductDetailDto {
  id: string;
  slug: string;
  vendorId: string;
  categoryId: string;
  title: LocalizedTextDto;
  cover: MediaDto;
  price: number;
  discount?: DiscountDto;
  finalPrice: number;
  unit: string;
  stock: number;
  region: string;
  ratingAvg: number;
  ratingCount: number;
  description: LocalizedTextDto;
  gallery: MediaDto[];
  attributes: AttributeDto[];
  status: ProductDetailDtoStatus;
  viewsCount: number;
}
