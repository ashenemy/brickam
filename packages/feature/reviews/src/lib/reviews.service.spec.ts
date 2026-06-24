import {
    ConflictException,
    ForbiddenException,
    NotFoundException,
    ValidationException,
} from '@brickam/core-kit';
import type { CatalogServiceContract, OrdersServiceContract } from '@brickam/domain-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateReviewDto } from './dto/review.dto';
import type { ReviewsRepository } from './reviews.repository';
import { ReviewsService } from './reviews.service';

type VendorOrderOver = Partial<{
    id: string;
    orderId: string;
    vendorId: string;
    buyerId: string;
    orderStatus: string;
    productIds: string[];
}>;

const makeVendorOrder = (over: VendorOrderOver = {}) => ({
    id: 'vo1',
    orderId: 'o1',
    vendorId: 'v1',
    buyerId: 'b1',
    orderStatus: 'completed',
    productIds: ['p1', 'p2'],
    ...over,
});

const makeReviewDoc = (over: Record<string, unknown> = {}) => ({
    id: 'r1',
    _id: { toString: () => 'r1' },
    orderId: 'o1',
    vendorOrderId: 'vo1',
    buyerId: 'b1',
    vendorId: 'v1',
    productId: 'p1',
    rating: 5,
    text: 'Отлично',
    status: 'published',
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-06-01'),
    ...over,
});

const makeDto = (over: Partial<CreateReviewDto> = {}): CreateReviewDto => ({
    vendorOrderId: 'vo1',
    rating: 5,
    text: 'Отлично',
    productId: 'p1',
    ...over,
});

describe('ReviewsService', () => {
    let repo: {
        create: ReturnType<typeof vi.fn>;
        updateById: ReturnType<typeof vi.fn>;
        findByVendorOrder: ReturnType<typeof vi.fn>;
        findPublishedByVendor: ReturnType<typeof vi.fn>;
        findPublishedByProduct: ReturnType<typeof vi.fn>;
    };
    let orders: { getVendorOrderForReview: ReturnType<typeof vi.fn> };
    let catalog: { setProductRating: ReturnType<typeof vi.fn> };
    let service: ReviewsService;

    beforeEach(() => {
        repo = {
            create: vi.fn(),
            updateById: vi.fn(),
            findByVendorOrder: vi.fn().mockResolvedValue(null),
            findPublishedByVendor: vi.fn().mockResolvedValue([]),
            findPublishedByProduct: vi.fn().mockResolvedValue([]),
        };
        orders = { getVendorOrderForReview: vi.fn() };
        catalog = { setProductRating: vi.fn().mockResolvedValue(undefined) };
        service = new ReviewsService(
            repo as unknown as ReviewsRepository,
            orders as unknown as OrdersServiceContract,
            catalog as unknown as CatalogServiceContract,
        );
    });

    describe('create', () => {
        it('бросает NotFoundException, если саб-заказ не найден', async () => {
            orders.getVendorOrderForReview.mockResolvedValue(null);
            await expect(service.create('b1', makeDto())).rejects.toBeInstanceOf(NotFoundException);
        });

        it('бросает ForbiddenException для чужого саб-заказа', async () => {
            orders.getVendorOrderForReview.mockResolvedValue(makeVendorOrder({ buyerId: 'other' }));
            await expect(service.create('b1', makeDto())).rejects.toBeInstanceOf(
                ForbiddenException,
            );
        });

        it('бросает ValidationException, если заказ не completed', async () => {
            orders.getVendorOrderForReview.mockResolvedValue(
                makeVendorOrder({ orderStatus: 'paid' }),
            );
            await expect(service.create('b1', makeDto())).rejects.toBeInstanceOf(
                ValidationException,
            );
        });

        it('бросает ValidationException, если productId не из заказа', async () => {
            orders.getVendorOrderForReview.mockResolvedValue(makeVendorOrder());
            await expect(service.create('b1', makeDto({ productId: 'pX' }))).rejects.toBeInstanceOf(
                ValidationException,
            );
        });

        it('бросает ConflictException при повторном отзыве на тот же vendor_order', async () => {
            orders.getVendorOrderForReview.mockResolvedValue(makeVendorOrder());
            repo.findByVendorOrder.mockResolvedValue(makeReviewDoc());
            await expect(service.create('b1', makeDto())).rejects.toBeInstanceOf(ConflictException);
        });

        it('happy: создаёт отзыв и пересчитывает рейтинг товара через catalog', async () => {
            orders.getVendorOrderForReview.mockResolvedValue(makeVendorOrder());
            repo.findByVendorOrder.mockResolvedValue(null);
            repo.create.mockResolvedValue(makeReviewDoc());
            // После создания агрегат товара: две опубликованные оценки 5 и 4 → 4.5/2.
            repo.findPublishedByProduct.mockResolvedValue([
                makeReviewDoc({ rating: 5 }),
                makeReviewDoc({ rating: 4 }),
            ]);

            const result = await service.create('b1', makeDto());

            expect(repo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderId: 'o1',
                    vendorOrderId: 'vo1',
                    buyerId: 'b1',
                    vendorId: 'v1',
                    productId: 'p1',
                    rating: 5,
                    status: 'published',
                }),
            );
            expect(catalog.setProductRating).toHaveBeenCalledWith('p1', 4.5, 2);
            expect(result.id).toBe('r1');
            expect(result.status).toBe('published');
        });

        it('без productId не вызывает setProductRating, но пересчитывает вендора', async () => {
            orders.getVendorOrderForReview.mockResolvedValue(makeVendorOrder());
            repo.findByVendorOrder.mockResolvedValue(null);
            repo.create.mockResolvedValue(makeReviewDoc({ productId: undefined }));

            await service.create('b1', makeDto({ productId: undefined }));

            expect(catalog.setProductRating).not.toHaveBeenCalled();
            expect(repo.findPublishedByVendor).toHaveBeenCalledWith('v1');
        });
    });

    describe('recomputeProduct', () => {
        it('считает среднее по опубликованным и пишет в catalog', async () => {
            repo.findPublishedByProduct.mockResolvedValue([
                makeReviewDoc({ rating: 5 }),
                makeReviewDoc({ rating: 4 }),
                makeReviewDoc({ rating: 4 }),
            ]);
            const summary = await service.recomputeProduct('p1');
            expect(summary).toEqual({ ratingAvg: 4.3, ratingCount: 3 });
            expect(catalog.setProductRating).toHaveBeenCalledWith('p1', 4.3, 3);
        });
    });

    describe('recomputeVendor', () => {
        it('считает среднее по опубликованным отзывам вендора', async () => {
            repo.findPublishedByVendor.mockResolvedValue([
                makeReviewDoc({ rating: 3 }),
                makeReviewDoc({ rating: 5 }),
            ]);
            const summary = await service.recomputeVendor('v1');
            expect(summary).toEqual({ ratingAvg: 4, ratingCount: 2 });
        });
    });

    describe('setStatus', () => {
        it('бросает NotFoundException, если отзыв не найден', async () => {
            repo.updateById.mockResolvedValue(null);
            await expect(service.setStatus('rX', 'hidden')).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });

        it('hidden: пересчёт исключает скрытый (findPublished* не вернёт его)', async () => {
            repo.updateById.mockResolvedValue(makeReviewDoc({ status: 'hidden' }));
            // Опубликованные после скрытия — без скрытого отзыва.
            repo.findPublishedByProduct.mockResolvedValue([makeReviewDoc({ rating: 4 })]);
            repo.findPublishedByVendor.mockResolvedValue([makeReviewDoc({ rating: 4 })]);

            const result = await service.setStatus('r1', 'hidden');

            expect(repo.updateById).toHaveBeenCalledWith('r1', { status: 'hidden' });
            expect(catalog.setProductRating).toHaveBeenCalledWith('p1', 4, 1);
            expect(result.status).toBe('hidden');
        });
    });

    describe('listByProduct / listByVendor', () => {
        it('listByProduct возвращает отзывы с агрегатом', async () => {
            repo.findPublishedByProduct.mockResolvedValue([
                makeReviewDoc({ rating: 5 }),
                makeReviewDoc({ rating: 4 }),
            ]);
            const view = await service.listByProduct('p1');
            expect(view.ratingAvg).toBe(4.5);
            expect(view.ratingCount).toBe(2);
            expect(view.reviews).toHaveLength(2);
        });

        it('listByVendor возвращает отзывы с агрегатом', async () => {
            repo.findPublishedByVendor.mockResolvedValue([makeReviewDoc({ rating: 5 })]);
            const view = await service.listByVendor('v1');
            expect(view.ratingAvg).toBe(5);
            expect(view.ratingCount).toBe(1);
            expect(view.reviews).toHaveLength(1);
        });
    });
});
