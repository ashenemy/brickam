
export type ProductDetailDtoStatus = typeof ProductDetailDtoStatus[keyof typeof ProductDetailDtoStatus];


export const ProductDetailDtoStatus = {
  draft: 'draft',
  active: 'active',
  hidden: 'hidden',
} as const;
