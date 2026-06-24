import { AppConfigService } from '@brickam/config-kit';
import { RateLimitedException, ValidationException } from '@brickam/core-kit';
import { Injectable, Logger } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import type { OtpPurpose, OtpRecord, OtpRequestResult } from '../@types';

/** Конфиг OTP (подмножество AppConfigService.auth.otp). */
type OtpConfig = {
    length: number;
    ttlSeconds: number;
    maxAttempts: number;
    resendCooldownSeconds: number;
};

const BCRYPT_ROUNDS = 10;

/**
 * Сервис одноразовых кодов (OTP). In-memory стор, мок-SMS пишет код в лог.
 * Ключ записи: `${purpose}:${phone}`.
 */
@Injectable()
export class OtpService {
    private readonly logger = new Logger('OTP');
    private readonly store = new Map<string, OtpRecord>();
    private readonly config: OtpConfig;

    constructor(config: AppConfigService) {
        this.config = config.auth.otp;
    }

    /** Запрос OTP: проверка cooldown, генерация и хеш кода, мок-отправка SMS. */
    async request(phone: string, purpose: OtpPurpose): Promise<OtpRequestResult> {
        const key = this.key(phone, purpose);
        const now = Date.now();
        const existing = this.store.get(key);
        if (existing) {
            const elapsed = (now - existing.lastSentAt) / 1000;
            if (elapsed < this.config.resendCooldownSeconds) {
                throw new RateLimitedException('errors.auth.otpRateLimited');
            }
        }

        const code = this.generateCode(this.config.length);
        const hash = await bcrypt.hash(code, BCRYPT_ROUNDS);
        const expiresAt = now + this.config.ttlSeconds * 1000;
        this.store.set(key, { hash, expiresAt, attempts: 0, lastSentAt: now });

        // Мок-SMS: в реальной интеграции код уходит провайдеру, тут — в лог.
        this.logger.log(`OTP for ${phone} (${purpose}): ${code}`);

        return { expiresAt, phoneMasked: this.mask(phone) };
    }

    /** Проверка OTP: TTL, лимит попыток, сверка хеша. Успех удаляет запись. */
    async verify(phone: string, purpose: OtpPurpose, code: string): Promise<void> {
        const key = this.key(phone, purpose);
        const record = this.store.get(key);
        const now = Date.now();
        if (!record || record.expiresAt < now) {
            this.store.delete(key);
            throw new ValidationException('errors.auth.otpInvalid');
        }
        if (record.attempts >= this.config.maxAttempts) {
            throw new RateLimitedException('errors.auth.otpRateLimited');
        }
        const matches = await bcrypt.compare(code, record.hash);
        if (!matches) {
            record.attempts += 1;
            throw new ValidationException('errors.auth.otpInvalid');
        }
        this.store.delete(key);
    }

    private key(phone: string, purpose: OtpPurpose): string {
        return `${purpose}:${phone}`;
    }

    private generateCode(length: number): string {
        let code = '';
        for (let i = 0; i < length; i += 1) {
            code += Math.floor(Math.random() * 10).toString();
        }
        return code;
    }

    private mask(phone: string): string {
        return phone.length <= 4 ? phone : `${phone.slice(0, 4)}***${phone.slice(-2)}`;
    }
}
