import type { DiscountDto } from './discountDto';
import type { LocalizedTextDto } from './localizedTextDto';
import type { MediaDto } from './mediaDto';

export interface ProductListItemDto {
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
}
