import { NotFoundException } from '@brickam/core-kit';
import {
    type RenderedTemplate,
    TemplatesServiceContract,
    type TemplateVars,
} from '@brickam/domain-kit';
import { DEFAULT_LANG, type Lang, SUPPORTED_LANGS } from '@brickam/i18n-kit';
import { BaseCrudService } from '@brickam/server-kit';
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import type { CreateTemplateData, UpdateTemplateData } from '../@types';
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
