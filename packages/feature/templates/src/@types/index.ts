import type { LocalizedText, TemplateType } from '@brickam/domain-kit';

/** POJO для создания шаблона (используется в DEFAULT_TEMPLATES и сервисе). */
export type CreateTemplateData = {
    key: string;
    type: TemplateType;
    name: string;
    subject?: LocalizedText;
    content: LocalizedText;
    variables: string[];
    isActive?: boolean;
};

/** POJO для частичного обновления шаблона. */
export type UpdateTemplateData = Partial<Omit<CreateTemplateData, 'key'>> & {
    updatedBy?: string;
};

/**
 * POJO для upsert шаблона из админ-редактора. `content` обязателен (для создания);
 * остальные поля опциональны и при обновлении применяются выборочно.
 */
export type UpsertTemplateData = {
    content: LocalizedText;
    variables?: string[];
    subject?: LocalizedText;
    type?: TemplateType;
    name?: string;
    isActive?: boolean;
};

// Реэкспорт контрактов шаблонов из domain-kit для удобства потребителей.
export type {
    LocalizedText,
    RenderedTemplate,
    TemplateType,
    TemplateVars,
} from '@brickam/domain-kit';
