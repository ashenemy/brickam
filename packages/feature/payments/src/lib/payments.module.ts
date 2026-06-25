import { AppConfigService } from '@brickam/config-kit';
import { PaymentsServiceContract } from '@brickam/domain-kit';
import { Global, Logger, Module, type Provider } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './payment.schema';
import { PaymentsController } from './payments.controller';
import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';
import { ArcaPaymentProvider } from './providers/arca-payment.provider';
import { IdramPaymentProvider } from './providers/idram-payment.provider';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { PaymentProvider } from './providers/payment-provider';

/**
 * Фабрика провайдера платежей по `config.providers.payment`:
 * - `arca` → карточный VPOS ArCa (redirect + pull-подтверждение);
 * - `idram` → Idram (redirect + push-callback с MD5);
 * - иначе → mock.
 * Если у выбранного провайдера нет нужных ключей в `config.secrets` — фолбэк на
 * mock с предупреждением (dev/недонастроенная среда не падает).
 */
export const createPaymentProvider = (config: AppConfigService): PaymentProvider => {
    const logger = new Logger('Payment');
    const { secrets } = config;

    switch (config.providers.payment) {
        case 'arca': {
            if (secrets.arcaGatewayUrl && secrets.arcaUsername && secrets.arcaPassword) {
                return new ArcaPaymentProvider({
                    gatewayUrl: secrets.arcaGatewayUrl,
                    username: secrets.arcaUsername,
                    password: secrets.arcaPassword,
                });
            }
            logger.warn('ArCa selected but secrets are missing — falling back to mock');
            return new MockPaymentProvider();
        }
        case 'idram': {
            if (secrets.idramGatewayUrl && secrets.idramRecAccount && secrets.idramSecretKey) {
                return new IdramPaymentProvider({
                    gatewayUrl: secrets.idramGatewayUrl,
                    recAccount: secrets.idramRecAccount,
                    secretKey: secrets.idramSecretKey,
                });
            }
            logger.warn('Idram selected but secrets are missing — falling back to mock');
            return new MockPaymentProvider();
        }
        default:
            return new MockPaymentProvider();
    }
};

const paymentProvider: Provider = {
    provide: PaymentProvider,
    inject: [AppConfigService],
    useFactory: createPaymentProvider,
};

/**
 * Глобальный модуль платежей (Foundations §11). Биндит провайдер-заглушку к
 * токену `PaymentProvider` и реализацию `PaymentsService` к DI-токену
 * `PaymentsServiceContract`, чтобы `orders` зависел только от контракта.
 */
@Global()
@Module({
    imports: [MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }])],
    controllers: [PaymentsController],
    providers: [
        PaymentsRepository,
        paymentProvider,
        PaymentsService,
        { provide: PaymentsServiceContract, useExisting: PaymentsService },
    ],
    exports: [PaymentsServiceContract],
})
export class PaymentsModule {}
