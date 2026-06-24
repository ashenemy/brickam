import { AppConfigService } from '@brickam/config-kit';
import { NotFoundException, type Page, ValidationException } from '@brickam/core-kit';
import { CatalogServiceContract, type ProductSnapshot } from '@brickam/domain-kit';
import { BaseCrudService } from '@brickam/server-kit';
import { Injectable } from '@nestjs/common';
import type { ProductDetail, ProductListItem } from '../@types';
import { computeFinalPrice } from './discount.util';
import type { MediaDto } from './dto/media.dto';
import type { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import type { ProductFilterQueryDto } from './dto/product-filter-query.dto';
import { MediaValidator } from './media-validator';
import type { Product, ProductDocument } from './product.schema';
import { buildProductFilter, buildSort } from './product-filter.builder';
import { ProductsRepository } from './products.repository';

/**
 * Сервис товаров. Публичный поиск/детальная карточка отдают плоские контракты с
 * посчитанной finalPrice; create/update валидируют медиа против лимитов платформы.
 */
@Injectable()
export class ProductsService
    extends BaseCrudService<Product, CreateProductDto, UpdateProductDto>
    implements CatalogServiceContract
{
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly mediaValidator: MediaValidator,
        private readonly config: AppConfigService,
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

    /** Создаёт товар; перед сохранением валидирует cover и галерею. */
    override async create(dto: CreateProductDto): Promise<Product> {
        await this.validateMedia(dto.cover, dto.gallery);
        const doc = await this.productsRepository.create(dto as unknown as Partial<Product>);
        return this.toDetail(doc, new Date()) as unknown as Product;
    }

    /** Обновляет товар; валидирует медиа, если они переданы. */
    override async update(id: string, dto: UpdateProductDto): Promise<Product> {
        await this.validateMedia(dto.cover, dto.gallery);
        const doc = await this.productsRepository.updateById(
            id,
            dto as unknown as Partial<Product>,
        );
        if (!doc) {
            throw new NotFoundException();
        }
        return this.toDetail(doc, new Date()) as unknown as Product;
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
