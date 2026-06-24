
export type RegisterDtoRole = typeof RegisterDtoRole[keyof typeof RegisterDtoRole];


export const RegisterDtoRole = {
  buyer: 'buyer',
  vendor_owner: 'vendor_owner',
} as const;
