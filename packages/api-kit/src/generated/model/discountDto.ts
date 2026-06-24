import type { DiscountDtoType } from './discountDtoType';

export interface DiscountDto {
  type: DiscountDtoType;
  /** Значение скидки */
  value: number;
  activeFrom?: string;
  activeTo?: string;
}
