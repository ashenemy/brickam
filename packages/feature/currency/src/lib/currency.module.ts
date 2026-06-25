import { AppConfigService } from '@brickam/config-kit';
import { Module, type Provider } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CbaRatesProvider } from './cba-rates.provider';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';
import { ExchangeRate, ExchangeRateSchema } from './exchange-rate.schema';
import { ExchangeRatesRepository } from './exchange-rates.repository';
import { FallbackRatesProvider } from './fallback-rates.provider';
import { RatesProvider } from './rates-provider';

/**
 * Фабрика провайдера курсов: выбор по `config.providers.exchangeRates`.
 * 'cba' → ЦБ Армении, иначе зашитый фолбэк (как провайдер-паттерн в payments).
 */
const ratesProvider: Provider = {
    provide: RatesProvider,
    inject: [AppConfigService],
    useFactory: (config: AppConfigService): RatesProvider => {
        switch (config.providers.exchangeRates) {
            case 'cba':
                return new CbaRatesProvider();
            default:
                return new FallbackRatesProvider();
        }
    },
};

/**
 * Модуль валют (Foundations §11, Stage 11). НЕ @Global. Провайдер курсов — за
 * абстракцией `RatesProvider`, выбор по конфигу. ScheduleModule.forRoot()
 * подключает интегратор в сервере (здесь forRoot не добавляем). Зависит только
 * от kit (граница feature → не импортирует другие feature).
 */
@Module({
    imports: [MongooseModule.forFeature([{ name: ExchangeRate.name, schema: ExchangeRateSchema }])],
    controllers: [CurrencyController],
    providers: [ExchangeRatesRepository, ratesProvider, CurrencyService],
    exports: [CurrencyService],
})
export class CurrencyModule {}
