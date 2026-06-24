import { AppConfigService } from '@brickam/config-kit';
import { RateLimitedException, ValidationException } from '@brickam/core-kit';
import { Logger } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OtpService } from './otp.service';

/** Достаёт сгенерированный код из мок-SMS лога. */
function lastLoggedCode(spy: ReturnType<typeof vi.spyOn>): string {
    const msg = spy.mock.calls.at(-1)?.[0] as string;
    return msg.split(': ').at(-1) as string;
}

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

describe('OtpService', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('генерирует код заданной длины и верифицирует его', async () => {
        const logSpy = vi.spyOn(Logger.prototype, 'log');
        const service = new OtpService(makeConfig({ length: 5 }));
        const result = await service.request('+37412345678', 'verify');
        expect(result.phoneMasked).not.toContain('345678');
        const code = lastLoggedCode(logSpy);
        expect(code).toHaveLength(5);
        expect(/^\d+$/.test(code)).toBe(true);
        // верный код проходит, значит хеш != коду, но сверяется
        await expect(service.verify('+37412345678', 'verify', code)).resolves.toBeUndefined();
        logSpy.mockRestore();
    });

    it('просрочка кода → ValidationException', async () => {
        const service = new OtpService(makeConfig({ ttlSeconds: 60 }));
        await service.request('+37412345678', 'verify');
        vi.advanceTimersByTime(61_000);
        await expect(service.verify('+37412345678', 'verify', '000000')).rejects.toBeInstanceOf(
            ValidationException,
        );
    });

    it('превышение maxAttempts → RateLimitedException', async () => {
        const service = new OtpService(makeConfig({ maxAttempts: 2 }));
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
        const service = new OtpService(makeConfig({ resendCooldownSeconds: 60 }));
        await service.request('+37412345678', 'verify');
        await expect(service.request('+37412345678', 'verify')).rejects.toBeInstanceOf(
            RateLimitedException,
        );
        vi.advanceTimersByTime(61_000);
        await expect(service.request('+37412345678', 'verify')).resolves.toBeDefined();
    });

    it('неверный код → ValidationException', async () => {
        const service = new OtpService(makeConfig());
        await service.request('+37412345678', 'verify');
        await expect(
            service.verify('+37412345678', 'verify', 'totally-wrong'),
        ).rejects.toBeInstanceOf(ValidationException);
    });

    it('хеш в сторе не равен исходному коду', async () => {
        const logSpy = vi.spyOn(Logger.prototype, 'log');
        const service = new OtpService(makeConfig({ length: 6 }));
        await service.request('+37412345678', 'verify');
        const code = lastLoggedCode(logSpy);
        const store = (service as unknown as { store: Map<string, { hash: string }> }).store;
        const record = store.get('verify:+37412345678');
        expect(record).toBeDefined();
        expect(record?.hash).not.toBe(code);
        expect(await bcrypt.compare(code, record?.hash ?? '')).toBe(true);
        logSpy.mockRestore();
    });
});
