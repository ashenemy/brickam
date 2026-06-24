import {
    NotificationsServiceContract,
    TemplatesServiceContract,
    type TemplateVars,
} from '@brickam/domain-kit';
import { Injectable } from '@nestjs/common';
import { EmailChannel } from './channels/email.channel';
import { SmsChannel } from './channels/sms.channel';

/**
 * Сервис уведомлений. Реализует `NotificationsServiceContract` из domain-kit.
 * Тело и тема сообщений берутся ТОЛЬКО из рендера шаблона по ключу — никакого
 * хардкода текста в коде (Foundations §10/§16). Отправка делегируется
 * провайдер-каналам SMS/Email.
 */
@Injectable()
export class NotificationsService implements NotificationsServiceContract {
    constructor(
        private readonly templates: TemplatesServiceContract,
        private readonly sms: SmsChannel,
        private readonly email: EmailChannel,
    ) {}

    async sendSms(
        recipient: string,
        templateKey: string,
        lang: string,
        vars: TemplateVars,
    ): Promise<void> {
        const r = await this.templates.renderByKey(templateKey, lang, vars);
        await this.sms.send(recipient, r.body);
    }

    async sendEmail(
        recipient: string,
        templateKey: string,
        lang: string,
        vars: TemplateVars,
    ): Promise<void> {
        const r = await this.templates.renderByKey(templateKey, lang, vars);
        await this.email.send(recipient, r.subject ?? '', r.body);
    }
}
