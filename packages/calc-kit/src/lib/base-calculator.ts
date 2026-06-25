import type { CalcField, CalcInput, CalcResult, LocalizedText } from './types';

/**
 * Базовый калькулятор. Каждый конкретный знает свой ключ, мультиязычное имя,
 * категорию каталога (для подбора товаров), список полей ввода (для генерации
 * формы в UI) и умеет посчитать результат с запасом% и округлением вверх до упаковки.
 */
export abstract class BaseCalculator {
    /** Уникальный ключ калькулятора (например 'paint'). */
    abstract readonly key: string;

    /** Мультиязычное название. */
    abstract readonly name: LocalizedText;

    /** Slug категории каталога для подбора товаров. */
    abstract readonly categorySlug: string;

    /** Поля ввода — по ним UI строит форму. */
    abstract readonly fields: CalcField[];

    /** Выполнить расчёт по значениям формы. */
    abstract calculate(input: CalcInput): CalcResult;

    /**
     * Достать числовое значение поля: input[key] ?? default поля ?? fallback.
     * Гарантирует число даже если поле не заполнено в форме.
     */
    protected field(input: CalcInput, key: string, fallback: number): number {
        const fromInput = input[key];
        if (fromInput !== undefined) {
            return fromInput;
        }
        const def = this.fields.find((f) => f.key === key)?.default;
        return def ?? fallback;
    }
}
