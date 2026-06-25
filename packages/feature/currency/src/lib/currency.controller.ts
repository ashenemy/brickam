import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { ConversionView, DisplayCurrenciesView, RateView } from '../@types';
import { CurrencyService } from './currency.service';
import { ConversionDto, ConvertQueryDto, DisplayCurrenciesDto, RateDto } from './dto/currency.dto';
import { Public } from './public.decorator';

/**
 * Маршруты валют (Foundations §11, Stage 11). Все эндпоинты публичные:
 * курсы и конвертация нужны фронту для отображения. Расчёты заказа/комиссии
 * остаются в AMD — здесь только представление.
 */
@ApiTags('currency')
@Controller('currency')
export class CurrencyController {
    constructor(private readonly currencyService: CurrencyService) {}

    /** Актуальные курсы по всем валютам отображения (AMD за 1 единицу). */
    @Get('rates')
    @Public()
    @ApiOkResponse({ type: [RateDto], description: 'Актуальные курсы валют' })
    getRates(): Promise<RateView[]> {
        return this.currencyService.getRates();
    }

    /** Базовая валюта и список валют отображения. */
    @Get('display-currencies')
    @Public()
    @ApiOkResponse({ type: DisplayCurrenciesDto, description: 'Валюты отображения' })
    getDisplayCurrencies(): DisplayCurrenciesView {
        return {
            base: this.currencyService.baseCurrency,
            currencies: this.currencyService.displayCurrencies(),
        };
    }

    /** Конвертирует сумму из AMD в валюту отображения (только для показа). */
    @Get('convert')
    @Public()
    @ApiOkResponse({ type: ConversionDto, description: 'Результат конвертации' })
    async convert(@Query() query: ConvertQueryDto): Promise<ConversionView> {
        const converted = await this.currencyService.convert(query.amount, query.to);
        return { amount: query.amount, currency: query.to, converted };
    }
}
