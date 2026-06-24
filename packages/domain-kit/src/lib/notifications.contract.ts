import type { RenderedTemplate, TemplateVars } from '../@types';

/**
 * Контракт шаблонизатора. Реализует feature `templates`; остальные фичи
 * (`notifications`, `auth`) рендерят текст ТОЛЬКО через этот контракт — никакого
 * хардкода текстов уведомлений в коде (Foundations §10).
 */
export abstract class TemplatesServiceContract {
    abstract renderByKey(key: string, lang: string, vars: TemplateVars): Promise<RenderedTemplate>;
}

/**
 * Контракт уведомлений. Реализует feature `notifications`; тело берётся только из
 * templates по ключу. `auth` шлёт OTP через этот контракт (а не строкой в коде).
 */
export abstract class NotificationsServiceContract {
    abstract sendSms(
        recipient: string,
        templateKey: string,
        lang: string,
        vars: TemplateVars,
    ): Promise<void>;

    abstract sendEmail(
        recipient: string,
        templateKey: string,
        lang: string,
        vars: TemplateVars,
    ): Promise<void>;
}
