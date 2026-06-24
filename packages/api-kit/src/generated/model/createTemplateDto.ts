import type { CreateTemplateDtoType } from './createTemplateDtoType';
import type { LocalizedTextDto } from './localizedTextDto';

export interface CreateTemplateDto {
  /** Уникальный ключ шаблона */
  key: string;
  /** Канал шаблона */
  type: CreateTemplateDtoType;
  /** Человекочитаемое имя */
  name: string;
  /** Тема письма (для email) */
  subject?: LocalizedTextDto;
  /** Тело шаблона */
  content: LocalizedTextDto;
  /** Белый список переменных */
  variables: string[];
  /** Активен ли шаблон */
  isActive?: boolean;
}
