import { AppConfigService } from '@brickam/config-kit';
import { NotFoundException } from '@brickam/core-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductFilterQueryDto } from './dto/product-filter-query.dto';
import type { MediaValidator } from './media-validator';
import type { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';

const makeDoc = (over: Record<string, unknown> = {}) => ({
    id: 'p1',
    _id: { toString: () => 'p1' },
    slug: 'cement-50',
    vendorId: 'v1',
    categoryId: 'c1',
    title: { hy: 'Ց', ru: 'Цемент', en: 'Cement' },
    description: { hy: 'Դ', ru: 'Описание', en: 'Desc' },
    cover: { mediaType: 'image', url: 'https://x/c.png', thumbnailUrl: 'https://x/t.png' },
    gallery: [{ mediaType: 'image', url: 'https://x/g.png' }],
    price: 1000,
    discount: { type: 'percent', value: 10 },
    unit: 'bag',
    stock: 5,
    region: 'yerevan',
    status: 'active',
    attributes: [{ key: 'weight', value: '50kg' }],
    ratingAvg: 4.5,
    ratingCount: 12,
    viewsCount: 3,
    ...over,
});

const makeQuery = (over: Partial<ProductFilterQueryDto> = {}): ProductFilterQueryDto => {
    const dto = new ProductFilterQueryDto();
    dto.page = 1;
    dto.pageSize = 20;
    Object.assign(dto, over);
    return dto;
};

describe('ProductsService', () => {
    let repo: {
        findPaginated: ReturnType<typeof vi.fn>;
        findBySlug: ReturnType<typeof vi.fn>;
        incrementViews: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
        updateById: ReturnType<typeof vi.fn>;
        find: ReturnType<typeof vi.fn>;
    };
    let mediaValidator: { validate: ReturnType<typeof vi.fn> };
    let service: ProductsService;

    beforeEach(() => {
        repo = {
            findPaginated: vi.fn(),
            findBySlug: vi.fn(),
            incrementViews: vi.fn().mockResolvedValue(undefined),
            create: vi.fn(),
            updateById: vi.fn(),
            find: vi.fn(),
        };
        mediaValidator = { validate: vi.fn().mockResolvedValue(undefined) };
        const config = {
            pagination: { defaultPageSize: 20, maxPageSize: 50 },
        } as unknown as AppConfigService;
        service = new ProductsService(
            repo as unknown as ProductsRepository,
            mediaValidator as unknown as MediaValidator,
            config,
        );
    });

    describe('search', () => {
        it('маппит документы в ProductListItem с finalPrice и meta', async () => {
            repo.findPaginated.mockResolvedValue({
                data: [makeDoc()],
                meta: {
                    page: 1,
                    pageSize: 20,
                    total: 1,
                    totalPages: 1,
                    hasNext: false,
                    hasPrev: false,
                },
            });
            const page = await service.search(makeQuery({ q: 'цемент' }));
            expect(page.data).toHaveLength(1);
            const item = page.data[0]!;
            expect(item).toMatchObject({
                id: 'p1',
                slug: 'cement-50',
                price: 1000,
                finalPrice: 900,
                ratingAvg: 4.5,
            });
            expect(item.cover).toEqual({
                mediaType: 'image',
                url: 'https://x/c.png',
                thumbnailUrl: 'https://x/t.png',
            });
            // листинг не содержит description/gallery/status
            expect('description' in item).toBe(false);
            expect(page.meta.total).toBe(1);
        });

        it('клампит pageSize до maxPageSize', async () => {
            repo.findPaginated.mockResolvedValue({
                data: [],
                meta: {
                    page: 1,
                    pageSize: 50,
                    total: 0,
                    totalPages: 1,
                    hasNext: false,
                    hasPrev: false,
                },
            });
            await service.search(makeQuery({ pageSize: 200 }));
            expect(repo.findPaginated).toHaveBeenCalledWith(
                expect.anything(),
                { page: 1, pageSize: 50 },
                expect.anything(),
            );
        });
    });

    describe('getByIds', () => {
        it('пустой вход → пустой результат без обращения к репозиторию', async () => {
            const result = await service.getByIds([]);
            expect(result).toEqual([]);
            expect(repo.find).not.toHaveBeenCalled();
        });

        it('маппит найденные документы в ProductListItem', async () => {
            repo.find.mockResolvedValue([makeDoc(), makeDoc({ id: 'p2', slug: 'sand-25' })]);
            const result = await service.getByIds(['p1', 'p2']);
            expect(repo.find).toHaveBeenCalled();
            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({ id: 'p1', slug: 'cement-50', finalPrice: 900 });
            expect(result[1]).toMatchObject({ id: 'p2', slug: 'sand-25' });
            expect('description' in result[0]!).toBe(false);
        });
    });

    describe('getBySlug', () => {
        it('возвращает ProductDetail и инкрементит просмотры', async () => {
            repo.findBySlug.mockResolvedValue(makeDoc());
            const detail = await service.getBySlug('cement-50');
            expect(detail).toMatchObject({
                id: 'p1',
                finalPrice: 900,
                status: 'active',
                viewsCount: 3,
            });
            expect(detail.gallery).toHaveLength(1);
            expect(detail.attributes).toEqual([{ key: 'weight', value: '50kg' }]);
            expect(repo.incrementViews).toHaveBeenCalledWith('p1');
        });

        it('NotFound, если товара нет', async () => {
            repo.findBySlug.mockResolvedValue(null);
            await expect(service.getBySlug('missing')).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('create', () => {
        it('валидирует cover и галерею перед сохранением', async () => {
            repo.create.mockResolvedValue(makeDoc());
            await service.create({
                vendorId: 'v1',
                categoryId: 'c1',
                slug: 'cement-50',
                title: { hy: 'Ց', ru: 'Цемент', en: 'Cement' },
                description: { hy: 'Դ', ru: 'Описание', en: 'Desc' },
                cover: { mediaType: 'image', url: 'https://x/c.png' },
                gallery: [{ mediaType: 'image', url: 'https://x/g.png' }],
                price: 1000,
                unit: 'bag',
                region: 'yerevan',
            } as never);
            expect(mediaValidator.validate).toHaveBeenCalledTimes(2);
            expect(repo.create).toHaveBeenCalled();
        });

        it('без скидки finalPrice = price', async () => {
            repo.create.mockResolvedValue(makeDoc({ discount: undefined }));
            const detail = (await service.create({
                cover: { mediaType: 'image', url: 'https://x/c.png' },
            } as never)) as unknown as { price: number; finalPrice: number };
            expect(detail.finalPrice).toBe(detail.price);
        });
    });

    describe('update', () => {
        it('валидирует cover и возвращает деталь', async () => {
            repo.updateById.mockResolvedValue(makeDoc({ price: 2000, discount: undefined }));
            const detail = (await service.update('p1', {
                cover: { mediaType: 'image', url: 'https://x/c.png' },
            } as never)) as unknown as { id: string; finalPrice: number };
            expect(mediaValidator.validate).toHaveBeenCalledTimes(1);
            expect(detail.finalPrice).toBe(2000);
        });

        it('NotFound, если товара нет', async () => {
            repo.updateById.mockResolvedValue(null);
            await expect(service.update('x', {} as never)).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });
    });
});
