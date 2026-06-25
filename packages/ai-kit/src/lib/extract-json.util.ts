/**
 * Извлекает чистый JSON из ответа LLM (Foundations §13). LLM часто оборачивает
 * результат в markdown-ограждения ```json ... ``` или добавляет пояснения по
 * краям. Берём содержимое первой `{...}`-группы по балансу скобок (с учётом
 * строковых литералов и экранирования), чтобы потребитель мог надёжно вызвать
 * JSON.parse. Возвращает trimmed-исходник, если сбалансированной группы нет —
 * парсинг/ретраи остаются на стороне потребителя.
 */
export function extractJson(text: string): string {
    // Снимаем markdown-ограждение, если оно есть: ```json\n ... \n```
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const source = (fenced?.[1] ?? text).trim();

    const start = source.indexOf('{');
    if (start === -1) {
        return source;
    }

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < source.length; i += 1) {
        const ch = source[i];

        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (ch === '\\') {
                escaped = true;
            } else if (ch === '"') {
                inString = false;
            }
            continue;
        }

        if (ch === '"') {
            inString = true;
        } else if (ch === '{') {
            depth += 1;
        } else if (ch === '}') {
            depth -= 1;
            if (depth === 0) {
                return source.slice(start, i + 1);
            }
        }
    }

    return source;
}
