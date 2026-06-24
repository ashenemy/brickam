
export type RegisterDtoAccountType = typeof RegisterDtoAccountType[keyof typeof RegisterDtoAccountType];


export const RegisterDtoAccountType = {
  individual: 'individual',
  company: 'company',
} as const;
