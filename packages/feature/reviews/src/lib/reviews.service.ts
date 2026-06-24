import {
    ConflictException,
    ForbiddenException,
    NotFoundException,
    ValidationException,
} from '@brickam/core-kit';
import { CatalogServiceContract, OrdersServiceContract } from '@brickam/domain-kit';
import { Injectable } from '@nestjs/common';
import type { RatingSummary, ReviewContract, ReviewListView, ReviewStatus } from '../@types';
import type { CreateReviewDto } from './dto/review.dto';
import { computeRating } from './rating.util';
import type { ReviewDocument } from './review.schema';
import { ReviewsRepository } from './reviews.repository';

/**
 * Сервис отзывов (Foundations §15, Stage 7). Отзыв можно оставить только по
 * завершённому (`completed`) и своему саб-заказу вендора, ровно один на
 * vendor_order. Скрытые (`hidden`) отзывы исключаются из агрегата рейтинга.
 * Границы feature: orders/catalog доступны только по DI-контрактам.
 */
@Injectable()
export class ReviewsService {
    constructor(
        private readonly reviewsRepository: ReviewsRepository,
        private readonly orders: OrdersServiceContract,
        private readonly catalog: CatalogServiceContract,
    ) {}

    /** Маппит документ отзыва в плоский контракт. */
    private toContract(doc: ReviewDocument): ReviewContract {
        const contract: ReviewContract = {
            id: doc.id ?? doc._id.toString(),
            orderId: doc.orderId,
            vendorOrderId: doc.vendorOrderId,
            buyerId: doc.buyerId,
            vendorId: doc.vendorId,
            rating: doc.rating,
            text: doc.text,
            status: doc.status,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };
        if (doc.productId !== undefined) {
            contract.productId = doc.productId;
        }
        return contract;
    }

    /**
     * Создаёт отзыв по саб-заказу вендора с проверкой инвариантов:
     * саб-заказ существует, принадлежит покупателю, заказ завершён, товар
     * входит в заказ, отзыва по этому vendor_order ещё нет.
     */
    async create(buyerId: string, dto: CreateReviewDto): Promise<ReviewContract> {
        const vendorOrder = await this.orders.getVendorOrderForReview(dto.vendorOrderId);
        if (!vendorOrder) {
            throw new NotFoundException('errors.reviews.notFound');
        }
        if (vendorOrder.buyerId !== buyerId) {
            throw new ForbiddenException('errors.reviews.notOwner');
        }
        if (vendorOrder.orderStatus !== 'completed') {
            throw new ValidationException('errors.reviews.notCompleted');
        }
        if (dto.productId !== undefined && !vendorOrder.productIds.includes(dto.productId)) {
            throw new ValidationException('errors.reviews.productNotInOrder');
        }
        const existing = await this.reviewsRepository.findByVendorOrder(dto.vendorOrderId);
        if (existing) {
            throw new ConflictException('errors.reviews.duplicate');
        }

        const created = await this.reviewsRepository.create({
            orderId: vendorOrder.orderId,
            vendorOrderId: dto.vendorOrderId,
            buyerId,
            vendorId: vendorOrder.vendorId,
            ...(dto.productId !== undefined ? { productId: dto.productId } : {}),
            rating: dto.rating,
            text: dto.text,
            status: 'published',
        });

        if (dto.productId !== undefined) {
            await this.recomputeProduct(dto.productId);
        }
        await this.recomputeVendor(vendorOrder.vendorId);

        return this.toContract(created);
    }

    /** Пересчитывает рейтинг товара по опубликованным отзывам и пишет в catalog. */
    async recomputeProduct(productId: string): Promise<RatingSummary> {
        const reviews = await this.reviewsRepository.findPublishedByProduct(productId);
        const summary = computeRating(reviews.map((review) => review.rating));
        await this.catalog.setProductRating(productId, summary.ratingAvg, summary.ratingCount);
        return summary;
    }

    /**
     * Пересчитывает рейтинг вендора по опубликованным отзывам. Коллекции
     * vendors пока нет — агрегат отдаётся на чтение.
     * TODO: денормализация в vendors, когда появится фича.
     */
    async recomputeVendor(vendorId: string): Promise<RatingSummary> {
        const reviews = await this.reviewsRepository.findPublishedByVendor(vendorId);
        return computeRating(reviews.map((review) => review.rating));
    }

    /**
     * Меняет статус модерации отзыва и пересчитывает агрегаты затронутого
     * товара (если есть) и вендора (скрытые отзывы исключаются из агрегата).
     */
    async setStatus(reviewId: string, status: ReviewStatus): Promise<ReviewContract> {
        const updated = await this.reviewsRepository.updateById(reviewId, { status });
        if (!updated) {
            throw new NotFoundException('errors.reviews.notFound');
        }
        if (updated.productId !== undefined) {
            await this.recomputeProduct(updated.productId);
        }
        await this.recomputeVendor(updated.vendorId);
        return this.toContract(updated);
    }

    /** Опубликованные отзывы вендора с агрегатом рейтинга. */
    async listByVendor(vendorId: string): Promise<ReviewListView> {
        const docs = await this.reviewsRepository.findPublishedByVendor(vendorId);
        const summary = computeRating(docs.map((doc) => doc.rating));
        return { reviews: docs.map((doc) => this.toContract(doc)), ...summary };
    }

    /** Опубликованные отзывы товара с агрегатом рейтинга. */
    async listByProduct(productId: string): Promise<ReviewListView> {
        const docs = await this.reviewsRepository.findPublishedByProduct(productId);
        const summary = computeRating(docs.map((doc) => doc.rating));
        return { reviews: docs.map((doc) => this.toContract(doc)), ...summary };
    }
}
