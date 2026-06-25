import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Logger } from '@nestjs/common';
import { EmailChannel } from './email.channel';

/** Параметры подключения AWS SES (из config.secrets / env). */
export type SesEmailConfig = {
    region: string;
    from: string;
};

/** Минимальная часть SES-клиента, которую использует канал (для тестов). */
export type SesLikeClient = {
    send(command: SendEmailCommand): Promise<unknown>;
};

/**
 * Реальная отправка Email через AWS SES. Выбирается фабрикой канала, когда
 * `config.providers.email === 'ses'` и задан `emailFrom`. Клиент можно передать
 * извне (для юнит-тестов), иначе создаётся из `region` — креды берутся из
 * default credential chain (в ECS — IAM-роль таски).
 */
export class SesEmailChannel extends EmailChannel {
    private readonly logger = new Logger('Email:SES');
    private readonly client: SesLikeClient;

    constructor(
        private readonly config: SesEmailConfig,
        client?: SesLikeClient,
    ) {
        super();
        this.client = client ?? (new SESClient({ region: config.region }) as SesLikeClient);
    }

    override async send(recipient: string, subject: string, body: string): Promise<void> {
        await this.client.send(
            new SendEmailCommand({
                Source: this.config.from,
                Destination: { ToAddresses: [recipient] },
                Message: {
                    Subject: { Data: subject },
                    Body: { Html: { Data: body } },
                },
            }),
        );
        this.logger.log(`Email отправлено на ${recipient} через SES`);
    }
}
