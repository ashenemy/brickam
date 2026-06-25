import { AppConfigService } from '@brickam/config-kit';
import { RateLimitedException, ValidationException } from '@brickam/core-kit';
import type { NotificationsServiceContract } from '@brickam/domain-kit';
import type { KeyValueStore } from '@brickam/server-kit';
import bcrypt from 'bcryptjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OtpService } from './otp.service';

function makeConfig(overrides: Partial<Record<string, number>> = {}): AppConfigService {
    return {
        auth: {
            otp: {
                length: overrides['length'] ?? 6,
                ttlSeconds: overrides['ttlSeconds'] ?? 300,
                maxAttempts: overrides['maxAttempts'] ?? 3,
                resendCooldownSeconds: overrides['resendCooldownSeconds'] ?? 60,
            },
        },
    } as unknown as AppConfigService;
}

function makeNotifications() {
    return { sendSms: vi.fn(), sendEmail: vi.fn() } as unknown as NotificationsServiceContract & {
        sendSms: ReturnType<typeof vi.fn>;
    };
}

/** Достаёт код из последнего вызова notifications.sendSms (vars.code). */
function lastSentCode(notifications: { sendSms: ReturnType<typeof vi.fn> }): string {
    const call = notifications.sendSms.mock.calls.at(-1);
    return String((call?.[3] as { code: string }).code);
}

describe('OtpService', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('генерирует код заданной длины и шлёт его через шаблон auth.otp', async () => {
        const notifications = makeNotifications();
        const service = new OtpService(makeConfig({ length: 5 }), notifications);
        const result = await service.request('+37412345678', 'verify');
        expect(result.phoneMasked).not.toContain('345678');
        // отправка через notifications по ключу шаблона, не строкой
        expect(notifications.sendSms).toHaveBeenCalledWith(
            '+37412345678',
            'auth.otp',
            expect.any(String),
            expect.objectContaining({ code: expect.any(String) }),
        );
        const code = lastSentCode(notifications);
        expect(code).toHaveLength(5);
        expect(/^\d+$/.test(code)).toBe(true);
        await expect(service.verify('+37412345678', 'verify', code)).resolves.toBeUndefined();
    });

    it('reset использует шаблон auth.passwordReset', async () => {
        const notifications = makeNotifications();
        const service = new OtpService(makeConfig(), notifications);
        await service.request('+37412345678', 'reset');
        expect(notifications.sendSms).toHaveBeenCalledWith(
            '+37412345678',
            'auth.passwordReset',
            expect.any(String),
            expect.anything(),
        );
    });

    it('просрочка кода → ValidationException', async () => {
        const service = new OtpService(makeConfig({ ttlSeconds: 60 }), makeNotifications());
        await service.request('+37412345678', 'verify');
        vi.advanceTimersByTime(61_000);
        await expect(service.verify('+37412345678', 'verify', '000000')).rejects.toBeInstanceOf(
            ValidationException,
        );
    });

    it('превышение maxAttempts → RateLimitedException', async () => {
        const service = new OtpService(makeConfig({ maxAttempts: 2 }), makeNotifications());
        await service.request('+37412345678', 'verify');
        await expect(service.verify('+37412345678', 'verify', 'wrong')).rejects.toBeInstanceOf(
            ValidationException,
        );
        await expect(service.verify('+37412345678', 'verify', 'wrong')).rejects.toBeInstanceOf(
            ValidationException,
        );
        await expect(service.verify('+37412345678', 'verify', 'wrong')).rejects.toBeInstanceOf(
            RateLimitedException,
        );
    });

    it('повторный request в окне cooldown → RateLimitedException', async () => {
        const service = new OtpService(
            makeConfig({ resendCooldownSeconds: 60 }),
            makeNotifications(),
        );
        await service.request('+37412345678', 'verify');
        await expect(service.request('+37412345678', 'verify')).rejects.toBeInstanceOf(
            RateLimitedException,
        );
        vi.advanceTimersByTime(61_000);
        await expect(service.request('+37412345678', 'verify')).resolves.toBeDefined();
    });

    it('неверный код → ValidationException', async () => {
        const service = new OtpService(makeConfig(), makeNotifications());
        await service.request('+37412345678', 'verify');
        await expect(
            service.verify('+37412345678', 'verify', 'totally-wrong'),
        ).rejects.toBeInstanceOf(ValidationException);
    });

    it('хеш в сторе не равен исходному коду', async () => {
        const notifications = makeNotifications();
        const service = new OtpService(makeConfig({ length: 6 }), notifications);
        await service.request('+37412345678', 'verify');
        const code = lastSentCode(notifications);
        const store = (service as unknown as { store: KeyValueStore }).store;
        const record = await store.get<{ hash: string }>('otp:verify:+37412345678');
        expect(record).toBeDefined();
        expect(record?.hash).not.toBe(code);
        expect(await bcrypt.compare(code, record?.hash ?? '')).toBe(true);
    });
});
