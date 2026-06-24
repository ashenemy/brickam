/** Вид канала уведомления. */
export type ChannelKind = 'sms' | 'email';

// Реэкспорт контрактов уведомлений из domain-kit для удобства потребителей.
export type { RenderedTemplate, TemplateVars } from '@brickam/domain-kit';
