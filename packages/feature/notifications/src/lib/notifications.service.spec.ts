import type { RenderedTemplate, TemplatesServiceContract } from '@brickam/domain-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EmailChannel } from './channels/email.channel';
import type { SmsChannel } from './channels/sms.channel';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
    let templates: { renderByKey: ReturnType<typeof vi.fn> };
    let sms: { send: ReturnType<typeof vi.fn> };
    let email: { send: ReturnType<typeof vi.fn> };
    let service: NotificationsService;

    beforeEach(() => {
        templates = { renderByKey: vi.fn() };
        sms = { send: vi.fn() };
        email = { send: vi.fn() };
        service = new NotificationsService(
            templates as unknown as TemplatesServiceContract,
            sms as unknown as SmsChannel,
            email as unknown as EmailChannel,
        );
    });

    it('реализует контракт NotificationsServiceContract', () => {
        expect(typeof service.sendSms).toBe('function');
        expect(typeof service.sendEmail).toBe('function');
    });

    describe('sendSms', () => {
        it('рендерит шаблон по (key,lang,vars) и шлёт body из рендера', async () => {
            const rendered: RenderedTemplate = { body: 'X' };
            templates.renderByKey.mockResolvedValue(rendered);
            const vars = { code: '1234' };

            await service.sendSms('+37499000000', 'otp.sms', 'hy', vars);

            expect(templates.renderByKey).toHaveBeenCalledWith('otp.sms', 'hy', vars);
            expect(sms.send).toHaveBeenCalledWith('+37499000000', 'X');
        });

        it('текст из шаблона, а не из строки: тело берётся ровно из renderByKey', async () => {
            // Меняем тело шаблона на произвольную строку — сервис должен отдать
            // именно её в канал, ничего не формируя сам.
            templates.renderByKey.mockResolvedValue({ body: 'произвольный-текст-из-шаблона' });

            await service.sendSms('+37499000000', 'any.key', 'ru', {});

            const [, sentBody] = sms.send.mock.calls[0] as [string, string];
            expect(sentBody).toBe('произвольный-текст-из-шаблона');
        });
    });

    describe('sendEmail', () => {
        it('рендерит шаблон и шлёт subject+body из рендера', async () => {
            const rendered: RenderedTemplate = { subject: 'Тема', body: 'Тело' };
            templates.renderByKey.mockResolvedValue(rendered);
            const vars = { name: 'Արամ' };

            await service.sendEmail('user@example.com', 'welcome.email', 'hy', vars);

            expect(templates.renderByKey).toHaveBeenCalledWith('welcome.email', 'hy', vars);
            expect(email.send).toHaveBeenCalledWith('user@example.com', 'Тема', 'Тело');
        });

        it('подставляет пустую тему, если subject не задан в рендере', async () => {
            templates.renderByKey.mockResolvedValue({ body: 'Тело' });

            await service.sendEmail('user@example.com', 'no.subject', 'ru', {});

            expect(email.send).toHaveBeenCalledWith('user@example.com', '', 'Тело');
        });

        it('текст из шаблона, а не из строки: subject/body берутся ровно из renderByKey', async () => {
            templates.renderByKey.mockResolvedValue({ subject: 'S', body: 'B' });

            await service.sendEmail('user@example.com', 'any.key', 'en', {});

            const [, subject, body] = email.send.mock.calls[0] as [string, string, string];
            expect(subject).toBe('S');
            expect(body).toBe('B');
        });
    });
});
