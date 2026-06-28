import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';

/** Описание страны для телефонного ввода: ISO, код, флаг, маска (# = цифра). */
interface PhoneCountry {
    readonly iso: string;
    readonly name: string;
    readonly dial: string;
    readonly flag: string;
    readonly mask: string;
}

/** Поддерживаемые страны (флаги — /assets/flags). Первая — по умолчанию. */
const COUNTRIES: readonly PhoneCountry[] = [
    { iso: 'AM', name: 'Armenia', dial: '+374', flag: 'am', mask: '## ## ## ##' },
    { iso: 'RU', name: 'Russia', dial: '+7', flag: 'ru', mask: '### ###-##-##' },
    { iso: 'GB', name: 'United Kingdom', dial: '+44', flag: 'gb', mask: '#### ######' },
];

const DIGITS = (mask: string): number => (mask.match(/#/g) ?? []).length;

/** Накладывает маску (# → цифра) на строку цифр. */
function applyMask(raw: string, mask: string): string {
    let out = '';
    let di = 0;
    for (const ch of mask) {
        if (di >= raw.length) break;
        if (ch === '#') {
            out += raw[di];
            di += 1;
        } else {
            out += ch;
        }
    }
    return out;
}

/**
 * PhoneInput — телефонный ввод с выпадающим списком стран и маской по выбранной
 * стране. Значение через [(value)] в формате E.164 (`+374XXXXXXXX`). Флаги — SVG
 * из /assets/flags. Composite на Material (matMenu/matButton) + нативный input.
 */
@Component({
    selector: 'app-phone-input',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatButton, MatMenu, MatMenuItem, MatMenuTrigger],
    template: `
        <label class="flex flex-col gap-1.5">
            @if (label()) {
                <span class="text-text-secondary" style="font: var(--type-label)">{{ label() }}</span>
            }
            <span
                class="flex items-center gap-1 rounded-md bg-[rgb(var(--color-neutral-900)/0.5)] pr-3 shadow-[inset_0_0_0_1px_var(--border-default)] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[rgb(var(--color-accent))]"
            >
                <button
                    matButton
                    type="button"
                    class="bh-phone-country shrink-0"
                    [matMenuTriggerFor]="menu"
                    [disabled]="disabled()"
                    aria-label="Country code"
                >
                    <img
                        [src]="flagSrc(country())"
                        [alt]="country().iso"
                        class="h-4 w-6 rounded-[2px] object-cover"
                    />
                    <span class="ml-1 text-text-primary">{{ country().dial }}</span>
                </button>

                <input
                    class="min-w-0 flex-1 border-0 bg-transparent py-3 font-input text-16 text-text-primary outline-none"
                    type="tel"
                    inputmode="tel"
                    autocomplete="tel-national"
                    [value]="display()"
                    [placeholder]="placeholder()"
                    [disabled]="disabled()"
                    (input)="onInput($event)"
                />
            </span>
        </label>

        <mat-menu #menu="matMenu">
            @for (c of countries; track c.iso) {
                <button mat-menu-item type="button" (click)="selectCountry(c)">
                    <img
                        [src]="flagSrc(c)"
                        [alt]="c.iso"
                        class="mr-2 inline-block h-4 w-6 rounded-[2px] object-cover align-middle"
                    />
                    <span>{{ c.name }} {{ c.dial }}</span>
                </button>
            }
        </mat-menu>
    `,
    styles: `
        .bh-phone-country.mat-mdc-button {
            min-width: 0;
            padding: 0 8px;
        }
    `,
})
export class PhoneInputComponent {
    readonly label = input('');
    readonly disabled = input(false);
    /** E.164: `+<код><цифры>` (двусторонняя привязка). */
    readonly value = model('');

    protected readonly countries = COUNTRIES;
    protected readonly country = signal<PhoneCountry>(COUNTRIES[0]);
    protected readonly raw = signal('');

    protected readonly display = computed(() => applyMask(this.raw(), this.country().mask));
    protected readonly placeholder = computed(() => this.country().mask.replace(/#/g, '0'));

    protected flagSrc(c: PhoneCountry): string {
        return `/assets/flags/${c.flag}.svg`;
    }

    protected onInput(event: Event): void {
        const digits = (event.target as HTMLInputElement).value
            .replace(/\D/g, '')
            .slice(0, DIGITS(this.country().mask));
        this.raw.set(digits);
        this.emit();
    }

    protected selectCountry(c: PhoneCountry): void {
        this.country.set(c);
        this.raw.set(this.raw().slice(0, DIGITS(c.mask)));
        this.emit();
    }

    private emit(): void {
        const digits = this.raw();
        this.value.set(digits ? `${this.country().dial}${digits}` : '');
    }
}
