import { NotFoundException } from '@brickam/core-kit';
import type { AuditServiceContract, LocalizedText } from '@brickam/domain-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UpsertPageDto } from './dto/page.dto';
import type { PagesRepository } from './pages.repository';
import { PagesService } from './pages.service';

const loc = (s = 'x'): LocalizedText => ({ hy: s, ru: s, en: s });

const makeDoc = (over: Record<string, unknown> = {}) => ({
    id: 'p1',
    _id: { toString: () => 'p1' },
    slug: 'about',
    title: loc('Заголовок'),
    content: loc('Контент'),
    status: 'published',
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-06-01'),
    ...over,
});

const makeDto = (over: Partial<UpsertPageDto> = {}): UpsertPageDto => ({
    title: loc('Заголовок'),
    content: loc('Контент'),
    ...over,
});

describe('PagesService', () => {
    let repo: {
        findBySlug: ReturnType<typeof vi.fn>;
        findPublished: ReturnType<typeof vi.fn>;
        find: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
        updateById: ReturnType<typeof vi.fn>;
        deleteById: ReturnType<typeof vi.fn>;
    };
    let audit: { record: ReturnType<typeof vi.fn> };
    let service: PagesService;

    beforeEach(() => {
        repo = {
            findBySlug: vi.fn().mockResolvedValue(makeDoc()),
            findPublished: vi.fn().mockResolvedValue([]),
            find: vi.fn().mockResolvedValue([]),
            create: vi.fn().mockResolvedValue(makeDoc()),
            updateById: vi.fn().mockResolvedValue(makeDoc()),
            deleteById: vi.fn().mockResolvedValue(true),
        };
        audit = { record: vi.fn().mockResolvedValue(undefined) };
        service = new PagesService(
            repo as unknown as PagesRepository,
            audit as unknown as AuditServiceContract,
        );
    });

    describe('getPublished', () => {
        it('возвращает опубликованную страницу по slug', async () => {
            repo.findBySlug.mockResolvedValue(makeDoc({ status: 'published' }));
            const result = await service.getPublished('about');
            expect(repo.findBySlug).toHaveBeenCalledWith('about');
            expect(result.slug).toBe('about');
            expect(result.status).toBe('published');
        });

        it('бросает NotFound, если страница в статусе draft', async () => {
            repo.findBySlug.mockResolvedValue(makeDoc({ status: 'draft' }));
            await expect(service.getPublished('about')).rejects.toBeInstanceOf(NotFoundException);
        });

        it('бросает NotFound, если страницы нет', async () => {
            repo.findBySlug.mockResolvedValue(null);
            await expect(service.getPublished('nope')).rejects.toBeInstanceOf(NotFoundException);
        });

        it('включает seo-поля в контракт, если заданы', async () => {
            repo.findBySlug.mockResolvedValue(
                makeDoc({ seoTitle: loc('SEO'), seoDescription: loc('SEOD') }),
            );
            const result = await service.getPublished('about');
            expect(result.seoTitle).toEqual(loc('SEO'));
            expect(result.seoDescription).toEqual(loc('SEOD'));
        });
    });

    describe('listPublished', () => {
        it('возвращает опубликованные страницы', async () => {
            repo.findPublished.mockResolvedValue([makeDoc(), makeDoc({ id: 'p2', slug: 'terms' })]);
            const result = await service.listPublished();
            expect(repo.findPublished).toHaveBeenCalled();
            expect(result).toHaveLength(2);
        });
    });

    describe('adminList', () => {
        it('возвращает все страницы', async () => {
            repo.find.mockResolvedValue([makeDoc({ status: 'draft' }), makeDoc({ id: 'p2' })]);
            const result = await service.adminList();
            expect(repo.find).toHaveBeenCalled();
            expect(result).toHaveLength(2);
        });
    });

    describe('adminGet', () => {
        it('возвращает страницу любого статуса', async () => {
            repo.findBySlug.mockResolvedValue(makeDoc({ status: 'draft' }));
            const result = await service.adminGet('about');
            expect(result.status).toBe('draft');
        });

        it('бросает NotFound, если нет', async () => {
            repo.findBySlug.mockResolvedValue(null);
            await expect(service.adminGet('nope')).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('upsert', () => {
        it('создаёт новую страницу, если slug не найден, и пишет audit page.save', async () => {
            repo.findBySlug.mockResolvedValue(null);
            repo.create.mockResolvedValue(makeDoc());

            const result = await service.upsert('about', makeDto(), 'admin1');

            expect(repo.create).toHaveBeenCalledWith(
                expect.objectContaining({ slug: 'about', title: loc('Заголовок') }),
            );
            expect(repo.updateById).not.toHaveBeenCalled();
            expect(audit.record).toHaveBeenCalledWith({
                actorId: 'admin1',
                action: 'page.save',
                targetType: 'page',
                targetId: 'about',
            });
            expect(result.slug).toBe('about');
        });

        it('обновляет существующую страницу по slug и пишет audit', async () => {
            repo.findBySlug.mockResolvedValue(makeDoc());
            repo.updateById.mockResolvedValue(makeDoc({ status: 'published' }));

            await service.upsert('about', makeDto({ status: 'published' }), 'admin1');

            expect(repo.updateById).toHaveBeenCalledWith(
                'p1',
                expect.objectContaining({ slug: 'about', status: 'published' }),
            );
            expect(repo.create).not.toHaveBeenCalled();
            expect(audit.record).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'page.save', actorId: 'admin1' }),
            );
        });

        it('опускает seo-поля и status, если не заданы', async () => {
            repo.findBySlug.mockResolvedValue(null);
            await service.upsert('about', makeDto(), 'admin1');
            const arg = repo.create.mock.calls[0][0];
            expect(arg).not.toHaveProperty('status');
            expect(arg).not.toHaveProperty('seoTitle');
            expect(arg).not.toHaveProperty('seoDescription');
        });
    });

    describe('remove', () => {
        it('удаляет страницу по slug и пишет audit page.delete', async () => {
            repo.findBySlug.mockResolvedValue(makeDoc());

            await service.remove('about', 'admin1');

            expect(repo.deleteById).toHaveBeenCalledWith('p1');
            expect(audit.record).toHaveBeenCalledWith({
                actorId: 'admin1',
                action: 'page.delete',
                targetType: 'page',
                targetId: 'about',
            });
        });

        it('бросает NotFound, если страницы нет (audit не пишется)', async () => {
            repo.findBySlug.mockResolvedValue(null);
            await expect(service.remove('nope', 'admin1')).rejects.toBeInstanceOf(
                NotFoundException,
            );
            expect(audit.record).not.toHaveBeenCalled();
        });
    });
});
