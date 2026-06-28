import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { type Lang, LanguageService } from '@brickam/i18n-kit/browser';
import { CurrencyStore } from '../currency/currency.store';

/** Файл SVG-флага по коду языка (emoji-флаги не рендерятся на Windows). */
const LANG_FLAG_FILE: Record<string, string> = { hy: 'am', ru: 'ru', en: 'gb' };

/** Символ валюты по коду. */
const CURRENCY_SYMBOL: Record<string, string> = {
    AMD: '֏',
    RUB: '₽',
    USD: '$',
    EUR: '€',
};

/**
 * Переключатель языка и валюты в шапке. В закрытом виде: флаг активного языка ·
 * вертикальный делимитер · символ валюты. По клику — компактное меню в две колонки
 * с делимитером: слева флаги (язык), справа символы (валюта). Флаги — SVG из
 * /assets/flags (emoji-флаги не видны на Windows).
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
            <span class="inline-flex items-center gap-2">
                <img [src]="flagSrc(lang())" [alt]="lang()" class="h-4 w-6 rounded-[2px] object-cover" />
                <span class="h-5 w-px bg-[var(--border-default)]" aria-hidden="true"></span>
                <span class="text-18">{{ symbol(currencyStore.selected()) }}</span>
            </span>
        </button>

        <mat-menu #langMenu="matMenu" xPosition="before" panelClass="bh-langmenu">
            <div class="flex p-2">
                <!-- Язык: только флаги -->
                <div class="flex flex-col gap-1 pr-2">
                    @for (code of langs; track code) {
                        <button
                            type="button"
                            class="flex items-center justify-center rounded-md px-3 py-1.5 transition-colors duration-fast hover:bg-surface-chip"
                            [class.bg-surface-chip]="code === lang()"
                            [attr.aria-label]="code"
                            (click)="setLang(code)"
                        >
                            <img [src]="flagSrc(code)" [alt]="code" class="h-4 w-6 rounded-[2px] object-cover" />
                        </button>
                    }
                </div>

                <!-- Вертикальный делимитер -->
                <div class="w-px self-stretch bg-[var(--border-default)]" aria-hidden="true"></div>

                <!-- Валюта: только символы -->
                <div class="flex flex-col gap-1 pl-2">
                    @for (cur of currencyStore.currencies(); track cur) {
                        <button
                            type="button"
                            class="flex min-w-9 items-center justify-center rounded-md px-3 py-1.5 text-18 transition-colors duration-fast hover:bg-surface-chip"
                            [class.text-accent]="cur === currencyStore.selected()"
                            [class.bg-surface-chip]="cur === currencyStore.selected()"
                            [attr.aria-label]="cur"
                            (click)="setCurrency(cur)"
                        >
                            {{ symbol(cur) }}
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

    protected flagSrc(code: string): string {
        return `/assets/flags/${LANG_FLAG_FILE[code] ?? 'gb'}.svg`;
    }

    protected symbol(code: string): string {
        return CURRENCY_SYMBOL[code] ?? code;
    }

    protected setLang(code: Lang): void {
        this.i18n.setLang(code);
    }

    protected setCurrency(code: string): void {
        this.currencyStore.select(code);
    }
}
