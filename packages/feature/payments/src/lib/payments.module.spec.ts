import type { AppConfigService } from '@brickam/config-kit';
import { describe, expect, it } from 'vitest';
import { createPaymentProvider } from './payments.module';
import { ArcaPaymentProvider } from './providers/arca-payment.provider';
import { IdramPaymentProvider } from './providers/idram-payment.provider';
import { MockPaymentProvider } from './providers/mock-payment.provider';

const makeConfig = (payment: string, secrets: Record<string, string> = {}): AppConfigService =>
    ({ providers: { payment }, secrets }) as unknown as AppConfigService;

describe('createPaymentProvider', () => {
    it('arca с ключами → ArcaPaymentProvider', () => {
        const provider = createPaymentProvider(
            makeConfig('arca', {
                arcaGatewayUrl: 'https://arca.test',
                arcaUsername: 'u',
                arcaPassword: 'p',
            }),
        );
        expect(provider).toBeInstanceOf(ArcaPaymentProvider);
        expect(provider.name).toBe('arca');
    });

    it('idram с ключами → IdramPaymentProvider', () => {
        const provider = createPaymentProvider(
            makeConfig('idram', {
                idramGatewayUrl: 'https://idram.test',
                idramRecAccount: '110',
                idramSecretKey: 's',
            }),
        );
        expect(provider).toBeInstanceOf(IdramPaymentProvider);
        expect(provider.name).toBe('idram');
    });

    it('mock → MockPaymentProvider', () => {
        expect(createPaymentProvider(makeConfig('mock'))).toBeInstanceOf(MockPaymentProvider);
    });

    it('arca без ключей → фолбэк на mock', () => {
        expect(createPaymentProvider(makeConfig('arca'))).toBeInstanceOf(MockPaymentProvider);
    });

    it('idram без ключей → фолбэк на mock', () => {
        expect(createPaymentProvider(makeConfig('idram'))).toBeInstanceOf(MockPaymentProvider);
    });
});
