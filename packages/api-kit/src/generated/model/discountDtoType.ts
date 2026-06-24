
export type DiscountDtoType = typeof DiscountDtoType[keyof typeof DiscountDtoType];


export const DiscountDtoType = {
  percent: 'percent',
  amount: 'amount',
} as const;
