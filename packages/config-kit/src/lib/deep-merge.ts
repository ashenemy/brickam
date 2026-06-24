type Plain = Record<string, unknown>;

const isPlainObject = (value: unknown): value is Plain =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Глубокое слияние двух конфигов. Объекты сливаются рекурсивно,
 * массивы и скаляры из `override` полностью заменяют значения `base`.
 */
export const deepMerge = <T extends Plain>(base: T, override: Plain): T => {
    const result: Plain = { ...base };
    for (const [key, overrideValue] of Object.entries(override)) {
        const baseValue = result[key];
        if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
            result[key] = deepMerge(baseValue, overrideValue);
        } else {
            result[key] = overrideValue;
        }
    }
    return result as T;
};
