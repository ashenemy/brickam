import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    type OnInit,
    signal,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import {
    type BaseCalculator,
    CALCULATORS,
    type CalcField,
    type CalcResult,
} from '@brickam/calc-kit';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { ButtonComponent, InputComponent } from '@brickam/ui-kit';

/**
 * Страница калькуляторов материалов (route /calculators).
 * Выбор калькулятора из calc-kit, динамическая форма по полям, расчёт и
 * переход в каталог с предвыбранной категорией. OnPush + signals, SSR-safe.
 */
@Component({
    selector: 'app-calculators',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [InputComponent, ButtonComponent],
    template: `
        <section class="flex flex-col gap-6">
            <header class="flex flex-col gap-2">
                <h1 class="text-text-primary" style="font: var(--type-hero)">{{ t('calc.title') }}</h1>
                <p class="text-text-secondary max-w-content" style="font: var(--type-product)">
                    {{ t('calc.subtitle') }}
                </p>
            </header>

            <!-- Выбор калькулятора (плитки) -->
            <div
                class="flex flex-col gap-3"
                role="group"
                [attr.aria-label]="t('calc.pickCalculator')"
            >
                <span class="text-text-secondary" style="font: var(--type-label)">
                    {{ t('calc.pickCalculator') }}
                </span>
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    @for (calc of calculators; track calc.key) {
                        <button
                            type="button"
                            data-testid="calc-tile"
                            [attr.aria-pressed]="selectedKey() === calc.key"
                            [class]="tileClasses(selectedKey() === calc.key)"
                            (click)="select(calc.key)"
                        >
                            {{ calc.name[lang()] }}
                        </button>
                    }
                </div>
            </div>

            @if (selected(); as calc) {
                <!-- Динамическая форма -->
                <form
                    class="flex flex-col gap-4 max-w-content"
                    data-testid="calc-form"
                    (submit)="onCalculate($event)"
                >
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        @for (field of calc.fields; track field.key) {
                            <bh-input
                                type="number"
                                [label]="fieldLabel(field)"
                                [value]="valueOf(field.key)"
                                [attr.data-field]="field.key"
                                (changed)="setValue(field.key, $event)"
                            />
                        }
                    </div>

                    @if (error()) {
                        <p class="text-danger" data-testid="calc-error" style="font: var(--type-caption)">
                            {{ t('calc.invalidInput') }}
                        </p>
                    }

                    <div class="flex flex-wrap gap-3">
                        <bh-button type="submit" variant="primary">{{ t('calc.calculate') }}</bh-button>
                    </div>
                </form>

                <!-- Результат -->
                @if (result(); as res) {
                    <div
                        class="flex flex-col gap-4 max-w-content rounded-md p-5 bg-[rgb(var(--color-neutral-900)/0.9)] shadow-[inset_0_0_0_1px_var(--border-subtle),var(--shadow-inset)]"
                        data-testid="calc-result"
                    >
                        <h2 class="text-text-primary" style="font: var(--type-product)">
                            {{ t('calc.result') }}
                        </h2>
                        <div class="flex flex-col gap-1">
                            <p class="text-text-primary" data-testid="result-quantity" style="font: var(--type-label)">
                                {{ t('calc.quantity') }}: {{ res.quantity }} {{ res.unit[lang()] }}
                            </p>
                            <p class="text-text-primary" data-testid="result-packages" style="font: var(--type-label)">
                                {{ t('calc.packages') }}: {{ res.packages }} {{ res.packageUnit[lang()] }}
                            </p>
                        </div>

                        @if (res.breakdown.length) {
                            <div class="flex flex-col gap-1">
                                <span class="text-text-secondary" style="font: var(--type-caption)">
                                    {{ t('calc.breakdown') }}
                                </span>
                                <ul class="flex flex-col gap-1">
                                    @for (row of res.breakdown; track row.label[lang()]) {
                                        <li class="flex justify-between text-text-secondary" style="font: var(--type-caption)">
                                            <span>{{ row.label[lang()] }}</span>
                                            <span>{{ row.value }} {{ row.unit[lang()] }}</span>
                                        </li>
                                    }
                                </ul>
                            </div>
                        }

                        <div class="flex flex-wrap gap-3 pt-1">
                            <bh-button variant="secondary" (clicked)="pickProducts(res)">
                                {{ t('calc.pickProducts') }}
                            </bh-button>
                        </div>
                    </div>
                } @else {
                    <p class="text-text-tertiary" data-testid="calc-empty" style="font: var(--type-caption)">
                        {{ t('calc.empty') }}
                    </p>
                }
            }
        </section>
    `,
})
export class CalculatorsPageComponent implements OnInit {
    private readonly router = inject(Router);
    private readonly i18n = inject(LanguageService);
    private readonly title = inject(Title);
    private readonly metaService = inject(Meta);

    protected readonly calculators = CALCULATORS;
    protected readonly lang = this.i18n.lang;

    protected readonly selectedKey = signal<string | undefined>(CALCULATORS[0]?.key);
    /** Сырые строковые значения полей (по ключу поля). */
    protected readonly values = signal<Record<string, string>>({});
    protected readonly error = signal(false);
    protected readonly result = signal<CalcResult | undefined>(undefined);

    protected readonly selected = computed<BaseCalculator | undefined>(() =>
        this.calculators.find((c) => c.key === this.selectedKey()),
    );

    ngOnInit(): void {
        this.title.setTitle(this.t('calc.title'));
        this.metaService.updateTag({ name: 'description', content: this.t('calc.subtitle') });
        this.resetForm();
    }

    protected select(key: string): void {
        if (key === this.selectedKey()) {
            return;
        }
        this.selectedKey.set(key);
        this.resetForm();
    }

    /** Сброс значений на дефолты выбранного калькулятора. */
    private resetForm(): void {
        const calc = this.selected();
        const next: Record<string, string> = {};
        if (calc) {
            for (const field of calc.fields) {
                next[field.key] = field.default !== undefined ? String(field.default) : '';
            }
        }
        this.values.set(next);
        this.result.set(undefined);
        this.error.set(false);
    }

    protected valueOf(key: string): string {
        return this.values()[key] ?? '';
    }

    protected setValue(key: string, raw: string): void {
        this.values.update((v) => ({ ...v, [key]: raw }));
    }

    protected fieldLabel(field: CalcField): string {
        const lang = this.lang();
        const unit = field.unit?.[lang];
        return unit ? `${field.label[lang]} (${unit})` : field.label[lang];
    }

    protected onCalculate(event: Event): void {
        event.preventDefault();
        const calc = this.selected();
        if (!calc) {
            return;
        }

        const input: Record<string, number> = {};
        for (const field of calc.fields) {
            const raw = (this.values()[field.key] ?? '').trim();
            const n = Number(raw);
            if (raw === '' || !Number.isFinite(n)) {
                this.error.set(true);
                this.result.set(undefined);
                return;
            }
            input[field.key] = n;
        }

        this.error.set(false);
        this.result.set(calc.calculate(input));
    }

    protected pickProducts(res: CalcResult): void {
        void this.router.navigate(['/catalog'], {
            queryParams: { category: res.categorySlug },
        });
    }

    protected tileClasses(active: boolean): string {
        return [
            'h-14 px-3 rounded-md text-center transition-shadow duration-fast',
            'bg-[rgb(var(--color-neutral-900)/0.9)] text-text-primary font-input text-14',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]',
            active
                ? 'shadow-[inset_0_0_0_2px_rgb(var(--color-accent))]'
                : 'shadow-[inset_0_0_0_1px_var(--border-subtle),var(--shadow-inset)]',
        ].join(' ');
    }

    /** Перевод ключа на текущем языке (реактивно). */
    protected t(key: string): string {
        // Привязка к сигналу языка для перерасчёта в шаблоне.
        this.lang();
        return this.i18n.t(key);
    }
}
