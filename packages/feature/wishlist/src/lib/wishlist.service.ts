import { Injectable } from '@nestjs/common';
import type { WishlistItem, WishlistView } from '../@types';
import { WishlistRepository } from './wishlist.repository';
import type { WishlistDocument } from './wishlist.schema';

/**
 * Сервис вишлиста. Один документ на пользователя; операции add/remove
 * идемпотентны (повторный add того же товара не дублирует позицию, remove
 * отсутствующего товара не падает). Наружу отдаёт плоский контракт WishlistView.
 */
@Injectable()
export class WishlistService {
    constructor(private readonly wishlistRepository: WishlistRepository) {}

    /** Маппит документ (или его отсутствие) в плоский ответ {items,count}. */
    private toView(doc: WishlistDocument | null): WishlistView {
        const items: WishlistItem[] = doc
            ? doc.items.map((item) => ({ productId: item.productId, addedAt: item.addedAt }))
            : [];
        return { items, count: items.length };
    }

    /** Возвращает позиции пользователя; если документа нет — пустой вишлист. */
    async list(userId: string): Promise<WishlistView> {
        const doc = await this.wishlistRepository.findByUser(userId);
        return this.toView(doc);
    }

    /**
     * Идемпотентно добавляет товар: если productId уже есть — возвращает вишлист
     * без изменений; иначе апсертит документ пользователя и добавляет позицию.
     */
    async add(userId: string, productId: string): Promise<WishlistView> {
        const doc = await this.wishlistRepository.findByUser(userId);
        if (!doc) {
            const created = await this.wishlistRepository.create({
                userId,
                items: [{ productId, addedAt: new Date() }],
            });
            return this.toView(created);
        }
        if (doc.items.some((item) => item.productId === productId)) {
            return this.toView(doc);
        }
        const updated = await this.wishlistRepository.updateById(doc.id ?? doc._id.toString(), {
            $push: { items: { productId, addedAt: new Date() } },
        } as never);
        return this.toView(updated ?? doc);
    }

    /** Идемпотентно убирает товар; если документа/позиции нет — не падает. */
    async remove(userId: string, productId: string): Promise<WishlistView> {
        const doc = await this.wishlistRepository.findByUser(userId);
        if (!doc) {
            return this.toView(null);
        }
        const updated = await this.wishlistRepository.updateById(doc.id ?? doc._id.toString(), {
            $pull: { items: { productId } },
        } as never);
        return this.toView(updated ?? doc);
    }
}
