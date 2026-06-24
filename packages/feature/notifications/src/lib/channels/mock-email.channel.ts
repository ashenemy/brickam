import { Injectable, Logger } from '@nestjs/common';
import { EmailChannel } from './email.channel';

/**
 * Mock-реализация Email-канала. Ничего не отправляет наружу — только пишет в лог,
 * чтобы работать в dev/тестах без реального провайдера (Foundations §16).
 */
@Injectable()
export class MockEmailChannel extends EmailChannel {
    private readonly logger = new Logger('Email');

    override async send(recipient: string, subject: string, body: string): Promise<void> {
        this.logger.log(`Email to ${recipient} | ${subject} | ${body}`);
    }
}
