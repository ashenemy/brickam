import { AppConfigService } from '@brickam/config-kit';
import { NotificationsServiceContract } from '@brickam/domain-kit';
import { Global, Logger, Module, type Provider } from '@nestjs/common';
import { EmailChannel } from './channels/email.channel';
import { createEmailChannel } from './channels/email-channel.factory';
import { MockSmsChannel } from './channels/mock-sms.channel';
import { SmsChannel } from './channels/sms.channel';
import { TwilioSmsChannel } from './channels/twilio-sms.channel';
import { NotificationsService } from './notifications.service';

// SMS-канал выбирается по `config.providers.sms`. Для 'twilio' нужны ключи
// (TWILIO_ACCOUNT_SID/AUTH_TOKEN/FROM в secrets); если их нет — фолбэк на mock,
// чтобы dev/тесты не падали без реального провайдера. Email — аналогично по
// `config.providers.email` ('ses' + emailFrom → SES, иначе mock).
const smsChannelProvider: Provider = {
    provide: SmsChannel,
    inject: [AppConfigService],
    useFactory: (config: AppConfigService): SmsChannel => {
        if (config.providers.sms === 'twilio') {
            const { twilioAccountSid, twilioAuthToken, twilioFrom } = config.secrets;
            if (twilioAccountSid && twilioAuthToken && twilioFrom) {
                return new TwilioSmsChannel({
                    accountSid: twilioAccountSid,
                    authToken: twilioAuthToken,
                    from: twilioFrom,
                });
            }
            new Logger('SMS').warn(
                'providers.sms=twilio, но TWILIO_* ключи не заданы — используется mock-канал',
            );
        }
        return new MockSmsChannel();
    },
};

const emailChannelProvider: Provider = {
    provide: EmailChannel,
    inject: [AppConfigService],
    useFactory: createEmailChannel,
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
