import { ValidationException } from '@brickam/core-kit';
import type { TemplateVars } from '@brickam/domain-kit';
import { Injectable } from '@nestjs/common';
import Handlebars from 'handlebars';

/** Извлекает имена переменных `{{ var }}` из текста шаблона. */
const VAR_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g;

/**
 * Рендерер шаблонов на Handlebars с валидацией переменных по белому списку
 * (Foundations §10). Гарантирует, что в шаблоне нет необъявленных переменных и
 * что все объявленные переданы в data.
 */
@Injectable()
export class TemplateRenderer {
    /**
     * Рендерит шаблон, предварительно валидируя переменные.
     *
     * @param template Текст шаблона с `{{var}}`.
     * @param variables Белый список разрешённых переменных.
     * @param data Значения переменных для подстановки.
     * @throws ValidationException при использовании переменной вне whitelist,
     *   пропуске объявленной переменной или передаче неизвестного ключа.
     */
    render(template: string, variables: string[], data: TemplateVars): string {
        const whitelist = new Set(variables);
        const used = this.extractUsedVariables(template);

        // 1. Каждая использованная в шаблоне переменная должна быть в whitelist.
        const notWhitelisted = [...used].filter((name) => !whitelist.has(name));
        if (notWhitelisted.length > 0) {
            throw new ValidationException('errors.validation', {
                unknownInTemplate: notWhitelisted,
            });
        }

        // 2. Каждая переменная из whitelist должна присутствовать в data.
        const missing = variables.filter((name) => !(name in data));
        if (missing.length > 0) {
            throw new ValidationException('errors.validation', { missing });
        }

        // 3. Ключ data вне whitelist — неизвестная переменная.
        const unknown = Object.keys(data).filter((name) => !whitelist.has(name));
        if (unknown.length > 0) {
            throw new ValidationException('errors.validation', { unknown });
        }

        const compiled = Handlebars.compile(template, { strict: true, noEscape: true });
        return compiled(data);
    }

    /** Возвращает множество имён переменных, использованных в шаблоне. */
    private extractUsedVariables(template: string): Set<string> {
        const result = new Set<string>();
        for (const match of template.matchAll(VAR_PATTERN)) {
            const name = match[1];
            if (name !== undefined) {
                result.add(name);
            }
        }
        return result;
    }
}
