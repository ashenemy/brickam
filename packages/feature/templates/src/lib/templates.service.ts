import { NotFoundException } from '@brickam/core-kit';
import {
    type RenderedTemplate,
    TemplatesServiceContract,
    type TemplateVars,
} from '@brickam/domain-kit';
import { DEFAULT_LANG, type Lang, SUPPORTED_LANGS } from '@brickam/i18n-kit';
import { BaseCrudService } from '@brickam/server-kit';
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import type { CreateTemplateData, UpdateTemplateData, UpsertTemplateData } from '../@types';
import { DEFAULT_TEMPLATES } from './default-templates';
import type { Template } from './template.schema';
import { TemplateRenderer } from './template-renderer';
import { TemplatesRepository } from './templates.repository';

/**
 * Сервис шаблонов (Foundations §10). Наследует CRUD-инфраструктуру и реализует
 * `TemplatesServiceContract` из domain-kit — другие фичи рендерят текст только
 * через `renderByKey`, без хардкода уведомлений в коде.
 */
@Injectable()
export class TemplatesService
    extends BaseCrudService<Template, CreateTemplateData, UpdateTemplateData>
    implements TemplatesServiceContract, OnModuleInit
{
    private readonly logger = new Logger(TemplatesService.name);

    constructor(
        private readonly templatesRepository: TemplatesRepository,
        private readonly renderer: TemplateRenderer,
    ) {
        super(templatesRepository);
    }

    /** Идемпотентно засевает дефолтные шаблоны при старте (не падает без Mongo). */
    async onModuleInit(): Promise<void> {
        try {
            for (const tpl of DEFAULT_TEMPLATES) {
                const exists = await this.templatesRepository.findByKey(tpl.key);
                if (!exists) {
                    await this.templatesRepository.create(tpl as Partial<Template>);
                }
            }
        } catch (error) {
            this.logger.warn(
                `Не удалось засеять дефолтные шаблоны: ${(error as Error).message ?? error}`,
            );
        }
    }

    /** Поднимает версию при обновлении шаблона. */
    protected override async beforeCreate(dto: CreateTemplateData): Promise<Partial<Template>> {
        return { version: 1, ...dto } as Partial<Template>;
    }

    /** Находит активный шаблон по ключу (NotFound, если нет или неактивен). */
    async getByKey(key: string): Promise<Template> {
        const doc = await this.templatesRepository.findByKey(key);
        if (!doc?.isActive) {
            throw new NotFoundException();
        }
        return doc as unknown as Template;
    }

    /** Возвращает шаблон по ключу без проверки активности (для админ-CRUD). */
    async findByKey(key: string): Promise<Template> {
        const doc = await this.templatesRepository.findByKey(key);
        if (!doc) {
            throw new NotFoundException();
        }
        return doc as unknown as Template;
    }

    /** Обновляет шаблон по ключу с bump'ом версии (админ). */
    async updateByKey(key: string, dto: UpdateTemplateData): Promise<Template> {
        const doc = await this.templatesRepository.findByKey(key);
        if (!doc) {
            throw new NotFoundException();
        }
        const updated = await this.templatesRepository.updateById(doc.id, {
            ...dto,
            version: (doc.version ?? 1) + 1,
        });
        if (!updated) {
            throw new NotFoundException();
        }
        return updated as unknown as Template;
    }

    /** Список всех шаблонов (админ-редактор, без пагинации). */
    list(): Promise<Template[]> {
        return this.templatesRepository.find() as unknown as Promise<Template[]>;
    }

    /**
     * Создаёт или обновляет шаблон по ключу (админ-редактор). Если шаблона нет —
     * создаёт; иначе обновляет content/variables/subject?/type с bump'ом версии.
     */
    async upsert(key: string, dto: UpsertTemplateData): Promise<Template> {
        const existing = await this.templatesRepository.findByKey(key);
        if (!existing) {
            const created = await this.templatesRepository.create({
                key,
                name: dto.name ?? key,
                type: dto.type ?? 'email',
                content: dto.content,
                variables: dto.variables ?? [],
                ...(dto.subject !== undefined ? { subject: dto.subject } : {}),
                isActive: dto.isActive ?? true,
                version: 1,
            } as Partial<Template>);
            return created as unknown as Template;
        }
        const updated = await this.templatesRepository.updateById(existing.id, {
            ...(dto.content !== undefined ? { content: dto.content } : {}),
            ...(dto.variables !== undefined ? { variables: dto.variables } : {}),
            ...(dto.subject !== undefined ? { subject: dto.subject } : {}),
            ...(dto.type !== undefined ? { type: dto.type } : {}),
            ...(dto.name !== undefined ? { name: dto.name } : {}),
            ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
            version: (existing.version ?? 1) + 1,
        });
        if (!updated) {
            throw new NotFoundException();
        }
        return updated as unknown as Template;
    }

    /**
     * Превью рендера шаблона: рендерит шаблон по ключу с переданными значениями
     * переменных (подстановка `{{name}}` → значение через Handlebars). Возвращает
     * {subject?, body}. То же поведение, что у `renderByKey`.
     */
    previewRender(key: string, lang: string, sampleVars: TemplateVars): Promise<RenderedTemplate> {
        return this.renderByKey(key, lang, sampleVars);
    }

    /** Удаляет шаблон по ключу (админ). */
    async removeByKey(key: string): Promise<void> {
        const doc = await this.templatesRepository.findByKey(key);
        if (!doc) {
            throw new NotFoundException();
        }
        await this.templatesRepository.deleteById(doc.id);
    }

    /**
     * Рендерит шаблон по ключу для языка `lang`. Невалидный lang нормализуется к
     * DEFAULT_LANG. Для email дополнительно рендерит subject.
     */
    async renderByKey(key: string, lang: string, vars: TemplateVars): Promise<RenderedTemplate> {
        const template = await this.getByKey(key);
        const normalized = this.normalizeLang(lang);

        const body = this.renderer.render(template.content[normalized], template.variables, vars);
        const result: RenderedTemplate = { body };

        if (template.type === 'email' && template.subject) {
            result.subject = this.renderer.render(
                template.subject[normalized],
                template.variables,
                vars,
            );
        }

        return result;
    }

    /** Нормализует язык: если не из поддерживаемых — DEFAULT_LANG. */
    private normalizeLang(lang: string): Lang {
        return SUPPORTED_LANGS.includes(lang as Lang) ? (lang as Lang) : DEFAULT_LANG;
    }
}
