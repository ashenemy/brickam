import type { LocalizedTextDto } from './localizedTextDto';
import type { UpdateTemplateDtoType } from './updateTemplateDtoType';

export interface UpdateTemplateDto {
  type?: UpdateTemplateDtoType;
  name?: string;
  subject?: LocalizedTextDto;
  content?: LocalizedTextDto;
  variables?: string[];
  isActive?: boolean;
  /** Кто обновил */
  updatedBy?: string;
}
