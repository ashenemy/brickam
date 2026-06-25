import { inject, Pipe, type PipeTransform } from '@angular/core';
import { CurrencyStore } from './currency.store';

/**
 * Форматирует AMD-сумму в выбранную валюту отображения: {{ priceAmd | currencyDisplay }}.
 *
 * pure:false — пайп перевычисляется при каждом проходе CD, а store.format()
 * читает сигналы selected()/rates(), поэтому смена валюты/курсов реактивно
 * обновляет вывод. Исходное число не меняется — только представление.
 */
@Pipe({
    name: 'currencyDisplay',
    standalone: true,
    pure: false,
})
export class CurrencyDisplayPipe implements PipeTransform {
    private readonly store = inject(CurrencyStore);

    transform(amountAmd: number | null | undefined): string {
        if (amountAmd === null || amountAmd === undefined) {
            return '';
        }
        return this.store.format(amountAmd);
    }
}
