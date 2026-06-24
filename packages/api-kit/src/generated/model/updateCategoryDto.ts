import type { LocalizedTextDto } from './localizedTextDto';

export interface UpdateCategoryDto {
  /** Уникальный slug */
  slug?: string;
  /** Родительская категория */
  parentId?: string;
  name?: LocalizedTextDto;
  /** Иконка */
  icon?: string;
  /** Тип калькулятора */
  calculatorType?: string;
  /** Порядок вывода */
  order?: number;
}
