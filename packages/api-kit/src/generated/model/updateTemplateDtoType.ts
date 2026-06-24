
export type UpdateTemplateDtoType = typeof UpdateTemplateDtoType[keyof typeof UpdateTemplateDtoType];


export const UpdateTemplateDtoType = {
  email: 'email',
  sms: 'sms',
} as const;
