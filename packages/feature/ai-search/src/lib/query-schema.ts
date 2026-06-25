import { ValidationException } from '@brickam/core-kit';
import type { AiQuerySpec } from '@brickam/domain-kit';
import { z } from 'zod';

/**
 * Строгая zod-схема ответа LLM на описание проекта (Foundations §13).
 * Тема обязана нести непустые keywords; materialCategories допускают пустоту
 * (фолбэк-эвристика не знает категорий). Минимум одна тема.
 */
export const querySpecSchema = z.object({
    projectType: z.string().min(1),
    themes: z
        .array(
            z.object({
                name: z.string().min(1),
                materialCategories: z.array(z.string()),
                keywords: z.array(z.string()).min(1),
            }),
        )
        .min(1),
});

/**
 * Валидирует сырой объект против строгой схемы и обрезает число тем по
 * `maxThemes` (лимит из конфига). Кидает `ValidationException` при несоответствии
 * формы — потребитель ловит и уходит в ретрай/фолбэк.
 */
export function validateQuerySpec(obj: unknown, maxThemes: number): AiQuerySpec {
    const parsed = querySpecSchema.safeParse(obj);
    if (!parsed.success) {
        throw new ValidationException('errors.ai.invalidQuerySpec');
    }
    const spec = parsed.data;
    return {
        projectType: spec.projectType,
        themes: spec.themes.slice(0, Math.max(1, maxThemes)),
    };
}
