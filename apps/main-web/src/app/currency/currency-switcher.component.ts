import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { SelectComponent } from '@brickam/ui-kit';
import { CurrencyStore } from './currency.store';

/**
 * Переключатель валюты отображения. Рендерит доступные валюты из стора через
 * bh-select; по выбору вызывает store.select(...). Конвертация — только показ,
 * расчёты корзины/заказа остаются в AMD.
 */
@Component({
    selector: 'app-currency-switcher',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SelectComponent],
    template: `
        <div class="w-28" data-testid="currency-switcher">
            <bh-select
                [options]="options()"
                [value]="selected()"
                [attr.aria-label]="label()"
                (changed)="onChange($event)"
            />
        </div>
    `,
})
export class CurrencySwitcherComponent {
    private readonly store = inject(CurrencyStore);
    private readonly i18n = inject(LanguageService);

    protected readonly selected = this.store.selected;
    protected readonly options = computed(() =>
        this.store.currencies().map((c) => ({ label: c, value: c })),
    );

    protected label(): string {
        const key = 'currency.label';
        const translated = this.i18n.t(key);
        return translated === key ? 'Currency' : translated;
    }

    protected onChange(value: string | number): void {
        this.store.select(String(value));
    }
}
