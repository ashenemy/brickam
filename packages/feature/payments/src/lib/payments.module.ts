import { AppConfigService } from '@brickam/config-kit';
import { PaymentsServiceContract } from '@brickam/domain-kit';
import { Global, Module, type Provider } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './payment.schema';
import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { PaymentProvider } from './providers/payment-provider';

// TODO: реальный провайдер выбирается по `config.providers.payment`
// (idram/telcell/arca). Сейчас всегда mock; когда появятся интеграции — добавить
// ветвление по значению конфига. Фабрика оставлена как точка расширения.
const paymentProvider: Provider = {
    provide: PaymentProvider,
    inject: [AppConfigService],
    useFactory: (_config: AppConfigService): PaymentProvider => {
        // switch (_config.providers.payment) { case 'idram': return new IdramProvider(...) }
        return new MockPaymentProvider();
    },
};

/**
 * Глобальный модуль платежей (Foundations §11). Биндит провайдер-заглушку к
 * токену `PaymentProvider` и реализацию `PaymentsService` к DI-токену
 * `PaymentsServiceContract`, чтобы `orders` зависел только от контракта.
 */
@Global()
@Module({
    imports: [MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }])],
    providers: [
        PaymentsRepository,
        paymentProvider,
        PaymentsService,
        { provide: PaymentsServiceContract, useExisting: PaymentsService },
    ],
    exports: [PaymentsServiceContract],
})
export class PaymentsModule {}
