import type { PaginationMetaDto } from './paginationMetaDto';
import type { ProductListItemDto } from './productListItemDto';

export type ProductsControllerSearch200 = {
  success: boolean;
  data: ProductListItemDto[];
  meta: PaginationMetaDto;
};
