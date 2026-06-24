import { describe, expect, it } from 'vitest';
import { MockEmailChannel } from './mock-email.channel';
import { MockSmsChannel } from './mock-sms.channel';

describe('Mock-каналы (smoke)', () => {
    it('MockSmsChannel.send не падает', async () => {
        const channel = new MockSmsChannel();
        await expect(channel.send('+37499000000', 'тело')).resolves.toBeUndefined();
    });

    it('MockEmailChannel.send не падает', async () => {
        const channel = new MockEmailChannel();
        await expect(channel.send('user@example.com', 'тема', 'тело')).resolves.toBeUndefined();
    });
});
