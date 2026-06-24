import { Injectable, Logger } from '@nestjs/common';
import { SmsChannel } from './sms.channel';

/**
 * Mock-реализация SMS-канала. Ничего не отправляет наружу — только пишет в лог,
 * чтобы работать в dev/тестах без реального провайдера (Foundations §16).
 */
@Injectable()
export class MockSmsChannel extends SmsChannel {
    private readonly logger = new Logger('SMS');

    override async send(recipient: string, body: string): Promise<void> {
        this.logger.log(`SMS to ${recipient}: ${body}`);
    }
}
