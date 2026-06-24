
/**
 * Канал шаблона
 */
export type CreateTemplateDtoType = typeof CreateTemplateDtoType[keyof typeof CreateTemplateDtoType];


export const CreateTemplateDtoType = {
  email: 'email',
  sms: 'sms',
} as const;
