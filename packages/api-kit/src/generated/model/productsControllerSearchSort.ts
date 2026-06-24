
export type ProductsControllerSearchSort = typeof ProductsControllerSearchSort[keyof typeof ProductsControllerSearchSort];


export const ProductsControllerSearchSort = {
  price_asc: 'price_asc',
  price_desc: 'price_desc',
  rating_desc: 'rating_desc',
  newest: 'newest',
} as const;
