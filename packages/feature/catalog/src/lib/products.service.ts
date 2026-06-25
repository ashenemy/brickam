import { AppConfigService } from '@brickam/config-kit';
import { NotFoundException, type Page, ValidationException } from '@brickam/core-kit';
import {
    type BulkUpdate,
    CatalogBulkContract,
    CatalogSearchContract,
    CatalogServiceContract,
    EmbeddingProvider,
    type ProductBulkView,
    type ProductSearchHit,
    type ProductSnapshot,
} from '@brickam/domain-kit';
import { BaseCrudService } from '@brickam/server-kit';
import { Injectable, Logger } from '@nestjs/common';
import type { PipelineStage } from 'mongoose';
import type { ProductDetail, ProductListItem } from '../@types';
import { CategoriesRepository } from './categories.repository';
import { computeFinalPrice } from './discount.util';
import type { MediaDto } from './dto/media.dto';
import type { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import type { ProductFilterQueryDto } from './dto/product-filter-query.dto';
import { MediaValidator } from './media-validator';
import type { Product, ProductDocument } from './product.schema';
import { buildProductFilter, buildSort } from './product-filter.builder';
import { ProductsRepository } from './products.repository';

/** Экранирует спецсимволы regex, чтобы ключевое слово трактовалось как литерал. */
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Кол-во кандидатов для Atlas $vectorSearch (баланс точность/скорость). */
const VECTOR_NUM_CANDIDATES = 100;

/**
 * Сервис товаров. Публичный поиск/детальная карточка отдают плоские контракты с
 * посчитанной finalPrice; create/update валидируют медиа против лимитов платформы.
 * Реализует и контракт поиска для AI (keyword + vector) — Foundations §13.
 */
@Injectable()
export class ProductsService
    extends BaseCrudService<Product, CreateProductDto, UpdateProductDto>
    implements CatalogServiceContract, CatalogSearchContract, CatalogBulkContract
{
    private readonly logger = new Logger(ProductsService.name);

    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly categoriesRepository: CategoriesRepository,
        private readonly mediaValidator: MediaValidator,
        private readonly config: AppConfigService,
        private readonly embeddingProvider: EmbeddingProvider,
    ) {
        super(productsRepository, config.pagination.maxPageSize);
    }

    /** Маппит документ товара в элемент листинга с finalPrice. */
    private toListItem(doc: ProductDocument, now: Date): ProductListItem {
        const item: ProductListItem = {
            id: doc.id ?? doc._id.toString(),
            slug: doc.slug,
            vendorId: doc.vendorId,
            categoryId: doc.categoryId,
            title: { hy: doc.title.hy, ru: doc.title.ru, en: doc.title.en },
            cover: this.mapMedia(doc.cover),
            price: doc.price,
            finalPrice: computeFinalPrice(doc.price, doc.discount, now),
            unit: doc.unit,
            stock: doc.stock,
            region: doc.region,
            ratingAvg: doc.ratingAvg,
            ratingCount: doc.ratingCount,
        };
        if (doc.discount !== undefined) {
            item.discount = doc.discount;
        }
        return item;
    }

    /** Маппит документ товара в детальную карточку. */
    private toDetail(doc: ProductDocument, now: Date): ProductDetail {
        return {
            ...this.toListItem(doc, now),
            description: {
                hy: doc.description.hy,
                ru: doc.description.ru,
                en: doc.description.en,
            },
            gallery: doc.gallery.map((media) => this.mapMedia(media)),
            attributes: doc.attributes.map((attr) => ({ key: attr.key, value: attr.value })),
            status: doc.status,
            viewsCount: doc.viewsCount,
        };
    }

    /** Очищает медиа-дескриптор от лишних полей (валидационные метаданные не сохраняем). */
    private mapMedia(media: {
        mediaType: 'image' | 'video';
        url: string;
        thumbnailUrl?: string;
    }): ProductListItem['cover'] {
        const result: ProductListItem['cover'] = { mediaType: media.mediaType, url: media.url };
        if (media.thumbnailUrl !== undefined) {
            result.thumbnailUrl = media.thumbnailUrl;
        }
        return result;
    }

    /** Публичный поиск товаров: фильтр + сортировка + пагинация, маппинг в листинг. */
    async search(query: ProductFilterQueryDto): Promise<Page<ProductListItem>> {
        const filter = buildProductFilter(query);
        const sort = buildSort(query.sort);
        const pageSize = Math.min(query.pageSize, this.config.pagination.maxPageSize);
        const page = await this.productsRepository.findPaginated(
            filter,
            { page: query.page, pageSize },
            { sort },
        );
        const now = new Date();
        return {
            data: page.data.map((doc) => this.toListItem(doc, now)),
            meta: page.meta,
        };
    }

    /**
     * Возвращает товары по списку id (для обогащения вишлиста). Порядок
     * результата произвольный; отсутствующие id просто опускаются. Пустой вход —
     * пустой результат без обращения к БД.
     */
    async getByIds(ids: string[]): Promise<ProductListItem[]> {
        if (ids.length === 0) {
            return [];
        }
        const docs = await this.productsRepository.find({ _id: { $in: ids } } as never);
        const now = new Date();
        return docs.map((doc) => this.toListItem(doc, now));
    }

    /** Детальная карточка по slug (404 если нет); инкрементит счётчик просмотров. */
    async getBySlug(slug: string): Promise<ProductDetail> {
        const doc = await this.productsRepository.findBySlug(slug);
        if (!doc) {
            throw new NotFoundException();
        }
        await this.productsRepository.incrementViews(doc.id ?? doc._id.toString());
        return this.toDetail(doc, new Date());
    }

    /** Создаёт товар; перед сохранением валидирует cover и галерею, затем эмбеддит. */
    override async create(dto: CreateProductDto): Promise<Product> {
        await this.validateMedia(dto.cover, dto.gallery);
        const doc = await this.productsRepository.create(dto as unknown as Partial<Product>);
        await this.regenerateEmbedding(doc.id ?? doc._id.toString(), this.buildEmbeddingText(doc));
        return this.toDetail(doc, new Date()) as unknown as Product;
    }

    /** Обновляет товар; валидирует медиа, при изменении текста — переэмбеддит. */
    override async update(id: string, dto: UpdateProductDto): Promise<Product> {
        await this.validateMedia(dto.cover, dto.gallery);
        const doc = await this.productsRepository.updateById(
            id,
            dto as unknown as Partial<Product>,
        );
        if (!doc) {
            throw new NotFoundException();
        }
        if (dto.title !== undefined || dto.description !== undefined) {
            await this.regenerateEmbedding(
                doc.id ?? doc._id.toString(),
                this.buildEmbeddingText(doc),
            );
        }
        return this.toDetail(doc, new Date()) as unknown as Product;
    }

    /**
     * Собирает значимый текст товара для эмбеддинга: мультиязычный title +
     * description + атрибуты (ключ-значение помогают семантике). Пустые поля
     * отбрасываются, чтобы не зашумлять вектор.
     */
    private buildEmbeddingText(doc: ProductDocument): string {
        const parts: string[] = [
            doc.title.ru,
            doc.title.en,
            doc.title.hy,
            doc.description?.ru ?? '',
            doc.description?.en ?? '',
            doc.description?.hy ?? '',
            ...(doc.attributes ?? []).map((attr) => `${attr.key} ${attr.value}`),
        ];
        return parts
            .map((part) => part.trim())
            .filter((part) => part.length > 0)
            .join(' ');
    }

    /**
     * Генерирует эмбеддинг и сохраняет его в товар. Полностью изолирован: сбой
     * провайдера/индекса логируется и проглатывается — векторизация не должна
     * ронять создание/обновление товара (Foundations §13).
     */
    private async regenerateEmbedding(productId: string, text: string): Promise<void> {
        if (text.length === 0) {
            return;
        }
        try {
            const embedding = await this.embeddingProvider.embed(text);
            await this.productsRepository.updateById(productId, { embedding } as never);
        } catch (error) {
            this.logger.warn(
                `Не удалось сгенерировать эмбеддинг товара ${productId}: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            );
        }
    }

    /** Снимок товара для оформления заказа (CatalogServiceContract). */
    async getProductSnapshot(productId: string): Promise<ProductSnapshot | null> {
        const doc = await this.productsRepository.findById(productId);
        if (!doc) {
            return null;
        }
        return {
            id: doc.id ?? doc._id.toString(),
            vendorId: doc.vendorId,
            title: { hy: doc.title.hy, ru: doc.title.ru, en: doc.title.en },
            unit: doc.unit,
            price: doc.price,
            stock: doc.stock,
            ...(doc.discount !== undefined ? { discount: doc.discount } : {}),
        };
    }

    /** Списывает остаток с проверкой наличия (CatalogServiceContract). */
    async decrementStock(productId: string, qty: number): Promise<void> {
        const doc = await this.productsRepository.findById(productId);
        if (!doc) {
            throw new NotFoundException();
        }
        if (doc.stock < qty) {
            throw new ValidationException('errors.catalog.outOfStock', { productId });
        }
        await this.productsRepository.updateById(productId, {
            $inc: { stock: -qty },
        } as never);
    }

    /**
     * Модерация товара админом (§17): проставляет статус ('active' при approve,
     * 'hidden' при reject). 404, если товара нет.
     */
    async setStatus(productId: string, status: 'active' | 'hidden'): Promise<void> {
        const doc = await this.productsRepository.updateById(productId, { status });
        if (!doc) {
            throw new NotFoundException();
        }
    }

    /** Проставляет агрегированный рейтинг товара (пересчёт в reviews, CatalogServiceContract). */
    async setProductRating(
        productId: string,
        ratingAvg: number,
        ratingCount: number,
    ): Promise<void> {
        await this.productsRepository.updateById(productId, { ratingAvg, ratingCount });
    }

    /**
     * Текстовый поиск по ключевым словам (CatalogSearchContract). Только active.
     * Каждое keyword → $or-регекс (case-insensitive, экранированный) по
     * title.ru/title.en/title.hy/description.*; разные keyword объединяются через
     * $or (любое совпадение). Опц. categorySlugs → categoryId через репозиторий
     * категорий (пустой список — без фильтра).
     */
    async keywordSearch(
        keywords: string[],
        categorySlugs: string[],
        limit: number,
    ): Promise<ProductSearchHit[]> {
        const terms = keywords.map((kw) => kw.trim()).filter((kw) => kw.length > 0);
        if (terms.length === 0) {
            return [];
        }
        const filter: Record<string, unknown> = { status: 'active' };
        const orClauses = terms.flatMap((term) => {
            const regex = { $regex: escapeRegExp(term), $options: 'i' };
            return [
                { 'title.ru': regex },
                { 'title.en': regex },
                { 'title.hy': regex },
                { 'description.ru': regex },
                { 'description.en': regex },
                { 'description.hy': regex },
            ];
        });
        filter['$or'] = orClauses;

        if (categorySlugs.length > 0) {
            const categories = await this.categoriesRepository.findBySlugs(categorySlugs);
            const categoryIds = categories.map((cat) => cat.id ?? cat._id.toString());
            // Slug-и не нашлись — фильтр по категории невозможен, отдаём пусто.
            if (categoryIds.length === 0) {
                return [];
            }
            filter['categoryId'] = { $in: categoryIds };
        }

        const docs = await this.productsRepository.findLimited(filter, limit);
        const now = new Date();
        return docs.map((doc) => this.toSearchHit(doc, now));
    }

    /**
     * Векторный поиск по products.embedding (Atlas Vector Search, индекс
     * 'product_embedding'). На локальном Mongo $vectorSearch недоступен —
     * любые ошибки aggregation проглатываются и возвращается [] (graceful
     * fallback, Foundations §13).
     */
    async vectorSearch(embedding: number[], limit: number): Promise<ProductSearchHit[]> {
        if (embedding.length === 0) {
            return [];
        }
        const pipeline: PipelineStage[] = [
            {
                $vectorSearch: {
                    index: 'product_embedding',
                    path: 'embedding',
                    queryVector: embedding,
                    numCandidates: VECTOR_NUM_CANDIDATES,
                    limit,
                },
            } as unknown as PipelineStage,
            { $match: { status: 'active' } },
        ];
        try {
            const docs = await this.productsRepository.aggregate(pipeline);
            const now = new Date();
            return docs.map((doc) => this.toSearchHit(doc, now));
        } catch (error) {
            this.logger.warn(
                `Векторный поиск недоступен (fallback на []): ${
                    error instanceof Error ? error.message : String(error)
                }`,
            );
            return [];
        }
    }

    /** Маппит документ товара в результат подбора для AI (ProductSearchHit). */
    private toSearchHit(doc: ProductDocument, now: Date): ProductSearchHit {
        const coverUrl = doc.gallery?.[0]?.url ?? doc.cover?.url;
        const hit: ProductSearchHit = {
            id: doc.id ?? doc._id.toString(),
            slug: doc.slug,
            title: { hy: doc.title.hy, ru: doc.title.ru, en: doc.title.en },
            finalPrice: computeFinalPrice(doc.price, doc.discount, now),
            unit: doc.unit,
            vendorId: doc.vendorId,
            categoryId: doc.categoryId,
        };
        if (coverUrl !== undefined) {
            hit.cover = coverUrl;
        }
        return hit;
    }

    /**
     * Проекции товаров вендора по списку id для массовых операций
     * (CatalogBulkContract, Foundations §14). Фильтрует по `vendorId` — чужие и
     * несуществующие товары просто не возвращаются. Пустой вход — без обращения к БД.
     */
    async listForBulk(vendorId: string, productIds: string[]): Promise<ProductBulkView[]> {
        if (productIds.length === 0) {
            return [];
        }
        const docs = await this.productsRepository.find({
            _id: { $in: productIds },
            vendorId,
        } as never);
        return docs.map((doc) => this.toBulkView(doc));
    }

    /** Маппит документ товара в проекцию для массовых операций. */
    private toBulkView(doc: ProductDocument): ProductBulkView {
        const view: ProductBulkView = {
            id: doc.id ?? doc._id.toString(),
            price: doc.price,
            stock: doc.stock,
            status: doc.status,
            categoryId: doc.categoryId,
            title: { hy: doc.title.hy, ru: doc.title.ru, en: doc.title.en },
        };
        if (doc.discount !== undefined) {
            view.discount = doc.discount;
        }
        return view;
    }

    /**
     * Применяет точечные обновления товаров (CatalogBulkContract, §14). Каждое
     * обновление пишется ТОЛЬКО в товар этого вендора (фильтр по `vendorId` в
     * репозитории). `fields.discount === null` → `$unset discount`; остальные
     * переданные поля → `$set`. Возвращает кол-во фактически обновлённых товаров.
     */
    async applyBulk(vendorId: string, updates: BulkUpdate[]): Promise<{ modified: number }> {
        let modified = 0;
        for (const { productId, fields } of updates) {
            const set: Record<string, unknown> = {};
            const unset: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(fields)) {
                if (key === 'discount' && value === null) {
                    unset['discount'] = '';
                } else if (value !== undefined) {
                    set[key] = value;
                }
            }
            modified += await this.productsRepository.updateOwned(productId, vendorId, set, unset);
        }
        return { modified };
    }

    /** Валидирует обложку и каждый элемент галереи через MediaValidator. */
    private async validateMedia(cover?: MediaDto, gallery?: MediaDto[]): Promise<void> {
        if (cover) {
            await this.mediaValidator.validate(cover);
        }
        for (const media of gallery ?? []) {
            await this.mediaValidator.validate(media);
        }
    }
}
