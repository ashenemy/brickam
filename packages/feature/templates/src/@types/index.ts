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

// Реэкспорт контрактов шаблонов из domain-kit для удобства потребителей.
export type {
    LocalizedText,
    RenderedTemplate,
    TemplateType,
    TemplateVars,
} from '@brickam/domain-kit';
