import { NotFoundException } from '@brickam/core-kit';
import { CatalogServiceContract } from '@brickam/domain-kit';
import { Injectable } from '@nestjs/common';
import type { CartContract, CartItemContract } from '../@types';
import type { Cart, CartDocument } from './cart.schema';
import { CartsRepository } from './carts.repository';

/**
 * Сервис корзины. Хранит позиции со снимком цены/скидки/vendorId на момент
 * добавления (снимок берётся у каталога через контракт). Граница feature —
 * только kit/domain, каталог доступен лишь по DI-токену CatalogServiceContract.
 */
@Injectable()
export class CartService {
    constructor(
        private readonly cartsRepository: CartsRepository,
        private readonly catalog: CatalogServiceContract,
    ) {}

    /** Маппит документ корзины в плоский контракт. */
    private toContract(doc: CartDocument): CartContract {
        return {
            buyerId: doc.buyerId,
            items: doc.items.map((item) => {
                const mapped: CartItemContract = {
                    productId: item.productId,
                    vendorId: item.vendorId,
                    qty: item.qty,
                    priceSnapshot: item.priceSnapshot,
                };
                if (item.discountSnapshot !== undefined) {
                    mapped.discountSnapshot = item.discountSnapshot;
                }
                return mapped;
            }),
        };
    }

    /** Возвращает (или создаёт пустую) корзину покупателя. */
    async getCart(buyerId: string): Promise<CartContract> {
        const doc = await this.ensureCart(buyerId);
        return this.toContract(doc);
    }

    /** Гарантирует существование корзины покупателя. */
    private async ensureCart(buyerId: string): Promise<CartDocument> {
        const existing = await this.cartsRepository.findByBuyer(buyerId);
        if (existing) {
            return existing;
        }
        return this.cartsRepository.create({ buyerId, items: [] } as Partial<Cart>);
    }

    /**
     * Добавляет товар в корзину: берёт снимок у каталога (нет товара → 404),
     * складывает количество, если позиция уже есть.
     */
    async addItem(buyerId: string, productId: string, qty: number): Promise<CartContract> {
        const snapshot = await this.catalog.getProductSnapshot(productId);
        if (!snapshot) {
            throw new NotFoundException('errors.catalog.productNotFound', { productId });
        }
        const doc = await this.ensureCart(buyerId);
        const existing = doc.items.find((item) => item.productId === productId);
        if (existing) {
            existing.qty += qty;
        } else {
            doc.items.push({
                productId,
                vendorId: snapshot.vendorId,
                qty,
                priceSnapshot: snapshot.price,
                ...(snapshot.discount !== undefined ? { discountSnapshot: snapshot.discount } : {}),
            } as CartDocument['items'][number]);
        }
        await doc.save();
        return this.toContract(doc);
    }

    /** Меняет количество позиции (нет позиции → 404). */
    async setQty(buyerId: string, productId: string, qty: number): Promise<CartContract> {
        const doc = await this.ensureCart(buyerId);
        const existing = doc.items.find((item) => item.productId === productId);
        if (!existing) {
            throw new NotFoundException('errors.orders.itemNotFound', { productId });
        }
        existing.qty = qty;
        await doc.save();
        return this.toContract(doc);
    }

    /** Удаляет позицию из корзины. */
    async removeItem(buyerId: string, productId: string): Promise<CartContract> {
        const doc = await this.ensureCart(buyerId);
        doc.items = doc.items.filter(
            (item) => item.productId !== productId,
        ) as CartDocument['items'];
        await doc.save();
        return this.toContract(doc);
    }

    /** Очищает корзину покупателя. */
    async clear(buyerId: string): Promise<CartContract> {
        const doc = await this.ensureCart(buyerId);
        doc.items = [] as unknown as CartDocument['items'];
        await doc.save();
        return this.toContract(doc);
    }
}
