import type { LocalizedTextDto } from './localizedTextDto';

export interface CategoryDto {
  id: string;
  slug: string;
  parentId?: string;
  name: LocalizedTextDto;
  icon?: string;
  order: number;
  calculatorType?: string;
}
