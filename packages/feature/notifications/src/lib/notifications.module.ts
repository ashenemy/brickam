import { AppConfigService } from '@brickam/config-kit';
import { NotificationsServiceContract } from '@brickam/domain-kit';
import { Global, Module, type Provider } from '@nestjs/common';
import { EmailChannel } from './channels/email.channel';
import { MockEmailChannel } from './channels/mock-email.channel';
import { MockSmsChannel } from './channels/mock-sms.channel';
import { SmsChannel } from './channels/sms.channel';
import { NotificationsService } from './notifications.service';

// TODO: реальный провайдер выбирается по `config.providers.sms` / e-mail-конфигу.
// Сейчас всегда возвращаем mock; когда появятся twilio/SMTP-каналы — добавить
// ветвление по значению конфига. Фабрики оставлены как точка расширения.
const smsChannelProvider: Provider = {
    provide: SmsChannel,
    inject: [AppConfigService],
    useFactory: (_config: AppConfigService): SmsChannel => {
        // switch (_config.providers.sms) { case 'twilio': return new TwilioSmsChannel(...) }
        return new MockSmsChannel();
    },
};

const emailChannelProvider: Provider = {
    provide: EmailChannel,
    inject: [AppConfigService],
    useFactory: (_config: AppConfigService): EmailChannel => {
        return new MockEmailChannel();
    },
};

/**
 * Глобальный модуль уведомлений. Биндит провайдер-каналы SMS/Email и
 * реализацию `NotificationsService` к DI-токену `NotificationsServiceContract`,
 * чтобы фичи (например auth) зависели только от контракта (Foundations §16).
 *
 * `TemplatesServiceContract` здесь НЕ объявляется — его предоставляет глобальный
 * модуль templates по тому же DI-токену.
 */
@Global()
@Module({
    providers: [
        smsChannelProvider,
        emailChannelProvider,
        NotificationsService,
        { provide: NotificationsServiceContract, useExisting: NotificationsService },
    ],
    exports: [NotificationsServiceContract],
})
export class NotificationsModule {}
