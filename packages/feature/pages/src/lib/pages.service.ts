import { NotFoundException } from '@brickam/core-kit';
import { AuditServiceContract } from '@brickam/domain-kit';
import { Injectable } from '@nestjs/common';
import type { PageContract } from '../@types';
import type { UpsertPageDto } from './dto/page.dto';
import type { PageDocument } from './page.schema';
import { PagesRepository } from './pages.repository';

/**
 * Сервис статических CMS-страниц (Foundations §15). Публичное чтение отдаёт
 * только опубликованные страницы; админ управляет всеми. Каждое изменение
 * (сохранение/удаление) пишется в аудит-лог через `AuditServiceContract`
 * (инжектится глобально из feature `audit`). Границы feature: только kit/domain.
 */
@Injectable()
export class PagesService {
    constructor(
        private readonly pagesRepository: PagesRepository,
        private readonly audit: AuditServiceContract,
    ) {}

    /** Маппит документ страницы в плоский контракт. */
    private toContract(doc: PageDocument): PageContract {
        const contract: PageContract = {
            id: doc.id ?? doc._id.toString(),
            slug: doc.slug,
            title: doc.title,
            content: doc.content,
            status: doc.status,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };
        if (doc.seoTitle !== undefined) {
            contract.seoTitle = doc.seoTitle;
        }
        if (doc.seoDescription !== undefined) {
            contract.seoDescription = doc.seoDescription;
        }
        return contract;
    }

    /** Опубликованная страница по slug (нет/не published → NotFound). */
    async getPublished(slug: string): Promise<PageContract> {
        const doc = await this.pagesRepository.findBySlug(slug);
        if (doc?.status !== 'published') {
            throw new NotFoundException('errors.pages.notFound');
        }
        return this.toContract(doc);
    }

    /** Все опубликованные страницы (для меню/футера). */
    async listPublished(): Promise<PageContract[]> {
        const docs = await this.pagesRepository.findPublished();
        return docs.map((doc) => this.toContract(doc));
    }

    /** Все страницы (для админки). */
    async adminList(): Promise<PageContract[]> {
        const docs = await this.pagesRepository.find({}, { sort: { slug: 1 } });
        return docs.map((doc) => this.toContract(doc));
    }

    /** Одна страница по slug (любой статус, для админки) или NotFound. */
    async adminGet(slug: string): Promise<PageContract> {
        const doc = await this.pagesRepository.findBySlug(slug);
        if (!doc) {
            throw new NotFoundException('errors.pages.notFound');
        }
        return this.toContract(doc);
    }

    /**
     * Создаёт или обновляет страницу по slug (title/content/status/seo*) и
     * пишет событие page.save в аудит.
     */
    async upsert(slug: string, dto: UpsertPageDto, adminId: string): Promise<PageContract> {
        const existing = await this.pagesRepository.findBySlug(slug);
        const data = {
            slug,
            title: dto.title,
            content: dto.content,
            ...(dto.status !== undefined ? { status: dto.status } : {}),
            ...(dto.seoTitle !== undefined ? { seoTitle: dto.seoTitle } : {}),
            ...(dto.seoDescription !== undefined ? { seoDescription: dto.seoDescription } : {}),
        };
        const saved = existing
            ? await this.pagesRepository.updateById(existing.id ?? existing._id.toString(), data)
            : await this.pagesRepository.create(data);
        if (!saved) {
            throw new NotFoundException('errors.pages.notFound');
        }
        await this.audit.record({
            actorId: adminId,
            action: 'page.save',
            targetType: 'page',
            targetId: slug,
        });
        return this.toContract(saved);
    }

    /** Удаляет страницу по slug и пишет событие page.delete в аудит. */
    async remove(slug: string, adminId: string): Promise<void> {
        const existing = await this.pagesRepository.findBySlug(slug);
        if (!existing) {
            throw new NotFoundException('errors.pages.notFound');
        }
        await this.pagesRepository.deleteById(existing.id ?? existing._id.toString());
        await this.audit.record({
            actorId: adminId,
            action: 'page.delete',
            targetType: 'page',
            targetId: slug,
        });
    }
}
