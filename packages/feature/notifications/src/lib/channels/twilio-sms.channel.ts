import { Logger } from '@nestjs/common';
import twilio from 'twilio';
import { SmsChannel } from './sms.channel';

/** Параметры подключения Twilio (из config.secrets / env). */
export type TwilioSmsConfig = {
    accountSid: string;
    authToken: string;
    from: string;
};

/** Минимальная часть Twilio-клиента, которую использует канал (для тестов). */
export type TwilioLikeClient = {
    messages: { create(opts: { to: string; from: string; body: string }): Promise<unknown> };
};

/**
 * Реальная отправка SMS через Twilio. Выбирается фабрикой канала, когда
 * `config.providers.sms === 'twilio'` и заданы ключи. Клиент можно передать
 * извне (для юнит-тестов), иначе создаётся из accountSid/authToken.
 */
export class TwilioSmsChannel extends SmsChannel {
    private readonly logger = new Logger('SMS:Twilio');
    private readonly client: TwilioLikeClient;

    constructor(
        private readonly config: TwilioSmsConfig,
        client?: TwilioLikeClient,
    ) {
        super();
        this.client = client ?? (twilio(config.accountSid, config.authToken) as TwilioLikeClient);
    }

    override async send(recipient: string, body: string): Promise<void> {
        await this.client.messages.create({ to: recipient, from: this.config.from, body });
        this.logger.log(`SMS отправлено на ${recipient} через Twilio`);
    }
}
