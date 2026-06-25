// Локальные типы calc-kit. Кит автономен: НЕ импортирует другие @brickam-пакеты,
// поэтому LocalizedText продублирован здесь (совпадает по форме с domain-kit).

/** Мультиязычный текст (hy — дефолтный язык витрины). */
export type LocalizedText = {
    hy: string;
    ru: string;
    en: string;
};

/** Тип поля ввода калькулятора. Пока только число. */
export type CalcFieldType = 'number';

/**
 * Описание поля ввода калькулятора — по нему UI генерирует форму
 * (label/unit мультиязычные, default/min — подсказки для контрола).
 */
export type CalcField = {
    key: string;
    type: CalcFieldType;
    label: LocalizedText;
    unit?: LocalizedText;
    default?: number;
    min?: number;
};

/** Значения формы: ключ поля → число. */
export type CalcInput = Record<string, number>;

/** Строка детализации расчёта (например «литры», «объём м³»). */
export type CalcBreakdownItem = {
    label: LocalizedText;
    value: number;
    unit: LocalizedText;
};

/**
 * Результат расчёта. quantity — расчётное количество в базовой единице (unit),
 * packages — сколько упаковок купить (округление ВВЕРХ), categorySlug — для
 * подбора товаров в каталоге, breakdown — промежуточные величины для UI.
 */
export type CalcResult = {
    quantity: number;
    unit: LocalizedText;
    packages: number;
    packageUnit: LocalizedText;
    categorySlug: string;
    breakdown: CalcBreakdownItem[];
};
