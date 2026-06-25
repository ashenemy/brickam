import type { AiJobType, AiPrompts, ProductAiContext } from '@brickam/domain-kit';

/** Берёт базовый шаблон платформы по типу задачи. */
function baseTemplate(type: AiJobType, prompts: AiPrompts): string {
    switch (type) {
        case 'description':
            return prompts.description;
        case 'image':
            return prompts.image;
        case 'video':
            return prompts.video;
    }
}

/** Формирует читаемый блок контекста товара (пропускает пустые поля). */
function contextBlock(ctx: ProductAiContext | null): string {
    if (!ctx) {
        return '';
    }
    const lines: string[] = [];
    const titleRu = ctx.title.ru.trim();
    const titleEn = ctx.title.en.trim();
    if (titleRu) {
        lines.push(`Название (ru): ${titleRu}`);
    }
    if (titleEn) {
        lines.push(`Название (en): ${titleEn}`);
    }
    const descRu = ctx.description.ru.trim();
    if (descRu) {
        lines.push(`Описание: ${descRu}`);
    }
    if (ctx.categoryId) {
        lines.push(`Категория: ${ctx.categoryId}`);
    }
    if (lines.length === 0) {
        return '';
    }
    return ['Контекст товара:', ...lines].join('\n');
}

/**
 * Чистая детерминированная сборка итогового промпта (Foundations §13):
 * базовый шаблон платформы по типу + промпт продавца + контекст товара.
 * Без контекста (ctx === null или пустой) — собирает шаблон и промпт без падения.
 */
export function buildPrompt(
    type: AiJobType,
    prompts: AiPrompts,
    userPrompt: string,
    ctx: ProductAiContext | null,
): string {
    const parts: string[] = [baseTemplate(type, prompts).trim()];

    const seller = userPrompt.trim();
    if (seller) {
        parts.push(`Запрос продавца: ${seller}`);
    }

    const context = contextBlock(ctx);
    if (context) {
        parts.push(context);
    }

    return parts.filter((part) => part.length > 0).join('\n\n');
}
