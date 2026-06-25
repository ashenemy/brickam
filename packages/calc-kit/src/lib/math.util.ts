// Чистые математические утилиты калькуляторов (без побочных эффектов).

/** Применить запас (%) к величине: value * (1 + wastePercent/100). */
export function applyWaste(value: number, wastePercent: number): number {
    return value * (1 + wastePercent / 100);
}

/** Округлить до 2 знаков после запятой (для дробных количеств: литры/м³/кг). */
export function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

/** Округление ВВЕРХ до целого (для штук и упаковок). */
export function ceil(n: number): number {
    return Math.ceil(n);
}
