import { describe, expect, it, vi } from 'vitest';
import { TwilioSmsChannel } from './twilio-sms.channel';

describe('TwilioSmsChannel', () => {
    const cfg = { accountSid: 'AC_test', authToken: 'token', from: '+37400000000' };

    it('send отправляет SMS через client.messages.create с to/from/body', async () => {
        const create = vi.fn().mockResolvedValue({ sid: 'SM1' });
        const channel = new TwilioSmsChannel(cfg, { messages: { create } });

        await channel.send('+37499123456', 'код 1234');

        expect(create).toHaveBeenCalledWith({
            to: '+37499123456',
            from: '+37400000000',
            body: 'код 1234',
        });
    });

    it('пробрасывает ошибку провайдера (не глотает)', async () => {
        const create = vi.fn().mockRejectedValue(new Error('twilio down'));
        const channel = new TwilioSmsChannel(cfg, { messages: { create } });

        await expect(channel.send('+37499123456', 'тело')).rejects.toThrow('twilio down');
    });
});
