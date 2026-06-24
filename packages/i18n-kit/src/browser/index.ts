import { ChangeDetectionStrategy, Component, Injectable, inject, signal } from '@angular/core';
import { DEFAULT_LANG, type Lang, SUPPORTED_LANGS, type TranslateParams } from '../@types';
import { dictionaries } from '../lib/dictionaries';
import { translate } from '../lib/translate';

const STORAGE_KEY = 'buildhub.lang';

/**
 * Angular-сервис языка: реактивный текущий язык (signal), переключатель,
 * перевод по словарям. Используется во всех трёх приложениях.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
    private readonly _lang = signal<Lang>(this.readInitialLang());
    readonly lang = this._lang.asReadonly();
    readonly supported = SUPPORTED_LANGS;

    setLang(lang: Lang): void {
        this._lang.set(lang);
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, lang);
        }
        if (typeof document !== 'undefined') {
            document.documentElement.lang = lang;
        }
    }

    /** Перевод ключа на текущем языке. */
    t(key: string, params?: TranslateParams): string {
        return translate(dictionaries[this._lang()], key, params);
    }

    private readInitialLang(): Lang {
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored && (SUPPORTED_LANGS as readonly string[]).includes(stored)) {
                return stored as Lang;
            }
        }
        return DEFAULT_LANG;
    }
}

/** Переиспользуемый переключатель языка (hy/ru/en) для всех трёх приложений. */
@Component({
    selector: 'bh-lang-switcher',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="bh-lang-switcher" role="group" aria-label="Language">
            @for (code of langs; track code) {
                <button
                    type="button"
                    [attr.aria-pressed]="lang() === code"
                    [class.active]="lang() === code"
                    (click)="select(code)"
                >
                    {{ labelOf(code) }}
                </button>
            }
        </div>
    `,
    styles: [
        `.bh-lang-switcher { display: inline-flex; gap: 4px; }
         .bh-lang-switcher button { cursor: pointer; padding: 4px 8px; }
         .bh-lang-switcher button.active { font-weight: 700; text-decoration: underline; }`,
    ],
})
export class LangSwitcherComponent {
    private readonly i18n = inject(LanguageService);
    readonly langs = this.i18n.supported;
    readonly lang = this.i18n.lang;

    select(code: Lang): void {
        this.i18n.setLang(code);
    }

    labelOf(code: Lang): string {
        return this.i18n.t(`lang.${code}`);
    }
}
