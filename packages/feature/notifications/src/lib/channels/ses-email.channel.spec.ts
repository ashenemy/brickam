import { SendEmailCommand } from '@aws-sdk/client-ses';
import { describe, expect, it, vi } from 'vitest';
import { SesEmailChannel } from './ses-email.channel';

describe('SesEmailChannel', () => {
    const cfg = { region: 'eu-central-1', from: 'no-reply@brickam.app' };

    it('send шлёт SendEmailCommand с верными Source/To/Subject/Body', async () => {
        const send = vi.fn().mockResolvedValue({ MessageId: 'm1' });
        const channel = new SesEmailChannel(cfg, { send });

        await channel.send('user@example.com', 'Тема', '<b>Тело</b>');

        expect(send).toHaveBeenCalledTimes(1);
        const command = send.mock.calls[0][0] as SendEmailCommand;
        expect(command).toBeInstanceOf(SendEmailCommand);
        expect(command.input).toEqual({
            Source: 'no-reply@brickam.app',
            Destination: { ToAddresses: ['user@example.com'] },
            Message: {
                Subject: { Data: 'Тема' },
                Body: { Html: { Data: '<b>Тело</b>' } },
            },
        });
    });

    it('пробрасывает ошибку провайдера (не глотает)', async () => {
        const send = vi.fn().mockRejectedValue(new Error('ses down'));
        const channel = new SesEmailChannel(cfg, { send });

        await expect(channel.send('user@example.com', 'тема', 'тело')).rejects.toThrow('ses down');
    });
});
