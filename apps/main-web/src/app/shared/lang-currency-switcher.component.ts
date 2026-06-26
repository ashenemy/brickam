import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { type Lang, LanguageService } from '@brickam/i18n-kit/browser';
import { CurrencyStore } from '../currency/currency.store';

/**
 * Переключатель языка и валюты в шапке: кнопка «EN · ₽» открывает выпадашку с
 * двумя колонками (язык | валюта). Inline-шаблон (интерполяции недопустимы во
 * внешнем app.html). Меняет язык через LanguageService, валюту — через CurrencyStore.
 */
@Component({
    selector: 'app-lang-currency',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatButton, MatMenu, MatMenuTrigger],
    template: `
        <button
            matButton
            type="button"
            class="bh-lang-btn shrink-0 font-display"
            [matMenuTriggerFor]="langMenu"
            aria-label="Language and currency"
        >
            <span class="uppercase">{{ lang() }}</span> · {{ currencyStore.selected() }}
        </button>

        <mat-menu #langMenu="matMenu">
            <div class="grid min-w-[220px] grid-cols-2 gap-3 p-3">
                <div>
                    <div class="mb-1 px-1 text-text-tertiary" style="font: var(--type-meta)">
                        Language
                    </div>
                    @for (code of langs; track code) {
                        <button
                            type="button"
                            class="block w-full rounded-sm px-2 py-1.5 text-left uppercase transition-colors duration-fast hover:bg-surface-chip"
                            [class.text-accent]="code === lang()"
                            (click)="setLang(code)"
                        >
                            {{ code }}
                        </button>
                    }
                </div>
                <div>
                    <div class="mb-1 px-1 text-text-tertiary" style="font: var(--type-meta)">
                        Currency
                    </div>
                    @for (cur of currencyStore.currencies(); track cur) {
                        <button
                            type="button"
                            class="block w-full rounded-sm px-2 py-1.5 text-left transition-colors duration-fast hover:bg-surface-chip"
                            [class.text-accent]="cur === currencyStore.selected()"
                            (click)="setCurrency(cur)"
                        >
                            {{ cur }}
                        </button>
                    }
                </div>
            </div>
        </mat-menu>
    `,
})
export class LangCurrencySwitcherComponent {
    private readonly i18n = inject(LanguageService);
    protected readonly currencyStore = inject(CurrencyStore);

    protected readonly lang = this.i18n.lang;
    protected readonly langs = this.i18n.supported;

    protected setLang(code: Lang): void {
        this.i18n.setLang(code);
    }

    protected setCurrency(code: string): void {
        this.currencyStore.select(code);
    }
}
