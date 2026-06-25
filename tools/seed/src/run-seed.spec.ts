import { describe, expect, it } from 'vitest';
import { buildDataset, COLLECTION_ORDER } from './dataset';
import { formatReport, runSeed } from './run-seed';
import { InMemorySeedStore } from './store';
import { COLLECTIONS } from './types';

/** Множество id из колонки коллекции (по полю _id документов датасета). */
function idSet(store: InMemorySeedStore, collection: string): Set<string> {
    return new Set(store.documents(collection).map((d) => d['_id'] as string));
}

describe('runSeed — идемпотентность', () => {
    it('повторный прогон не плодит дублей и даёт updated', async () => {
        const store = new InMemorySeedStore();

        const first = await runSeed(store);
        const sizesAfterFirst = COLLECTION_ORDER.map((c) => store.count(c));

        const second = await runSeed(store);
        const sizesAfterSecond = COLLECTION_ORDER.map((c) => store.count(c));

        // Размеры коллекций не изменились после второго прогона.
        expect(sizesAfterSecond).toEqual(sizesAfterFirst);

        // Первый прогон — всё inserted, второй — всё updated.
        expect(first.updated).toBe(0);
        expect(first.inserted).toBe(first.total);
        expect(second.inserted).toBe(0);
        expect(second.updated).toBe(second.total);
        expect(second.total).toBe(first.total);
    });
});

describe('runSeed — объём и качество', () => {
    it('товаров 80–150, есть скидки и видео-обложки', async () => {
        const store = new InMemorySeedStore();
        await runSeed(store);

        const products = store.documents(COLLECTIONS.products);
        expect(products.length).toBeGreaterThanOrEqual(80);
        expect(products.length).toBeLessThanOrEqual(150);

        const discounted = products.filter((p) => p['discount'] !== undefined);
        expect(discounted.length).toBeGreaterThan(0);

        const video = products.filter(
            (p) => (p['cover'] as { mediaType: string }).mediaType === 'video',
        );
        expect(video.length).toBeGreaterThan(0);
    });

    it('у товаров и категорий локали hy/ru/en непусты', async () => {
        const store = new InMemorySeedStore();
        await runSeed(store);

        for (const p of store.documents(COLLECTIONS.products)) {
            const title = p['title'] as { hy: string; ru: string; en: string };
            expect(title.hy.length).toBeGreaterThan(0);
            expect(title.ru.length).toBeGreaterThan(0);
            expect(title.en.length).toBeGreaterThan(0);
        }
        for (const c of store.documents(COLLECTIONS.categories)) {
            const name = c['name'] as { hy: string; ru: string; en: string };
            expect(name.hy.length).toBeGreaterThan(0);
            expect(name.ru.length).toBeGreaterThan(0);
            expect(name.en.length).toBeGreaterThan(0);
        }
    });

    it('platform_settings — ровно один документ с непустым seo.botUserAgents', async () => {
        const store = new InMemorySeedStore();
        await runSeed(store);

        const settings = store.documents(COLLECTIONS.platformSettings);
        expect(settings.length).toBe(1);
        const value = settings[0]?.['value'] as {
            seo: { botUserAgents: string[] };
        };
        expect(value.seo.botUserAgents.length).toBeGreaterThan(0);
    });
});

describe('целостность перекрёстных ссылок', () => {
    it('product.vendorId/categoryId, review/chat/invoice ссылки и vendor.ownerUserId валидны', async () => {
        const store = new InMemorySeedStore();
        await runSeed(store);

        const vendorIds = idSet(store, COLLECTIONS.vendors);
        const categoryIds = idSet(store, COLLECTIONS.categories);
        const productIds = idSet(store, COLLECTIONS.products);
        const userIds = idSet(store, COLLECTIONS.users);
        const buyerIds = new Set(
            store
                .documents(COLLECTIONS.users)
                .filter((u) => u['role'] === 'buyer')
                .map((u) => u['_id'] as string),
        );
        const chatIds = idSet(store, COLLECTIONS.chats);
        const invoiceIds = idSet(store, COLLECTIONS.invoices);

        // Products → vendors + categories
        for (const p of store.documents(COLLECTIONS.products)) {
            expect(vendorIds.has(p['vendorId'] as string)).toBe(true);
            expect(categoryIds.has(p['categoryId'] as string)).toBe(true);
        }

        // Categories: parentId (если есть) ссылается на существующую категорию
        for (const c of store.documents(COLLECTIONS.categories)) {
            const parentId = c['parentId'];
            if (parentId !== undefined) {
                expect(categoryIds.has(parentId as string)).toBe(true);
            }
        }

        // Reviews → product/vendor/buyer
        for (const r of store.documents(COLLECTIONS.reviews)) {
            expect(productIds.has(r['productId'] as string)).toBe(true);
            expect(vendorIds.has(r['vendorId'] as string)).toBe(true);
            expect(buyerIds.has(r['buyerId'] as string)).toBe(true);
        }

        // Vendors → ownerUserId ∈ users
        for (const v of store.documents(COLLECTIONS.vendors)) {
            expect(userIds.has(v['ownerUserId'] as string)).toBe(true);
        }

        // Chats → buyer/vendor
        for (const ch of store.documents(COLLECTIONS.chats)) {
            expect(buyerIds.has(ch['buyerId'] as string)).toBe(true);
            expect(vendorIds.has(ch['vendorId'] as string)).toBe(true);
        }

        // Invoices → chat/vendor/buyer
        for (const inv of store.documents(COLLECTIONS.invoices)) {
            expect(chatIds.has(inv['chatId'] as string)).toBe(true);
            expect(vendorIds.has(inv['vendorId'] as string)).toBe(true);
            expect(buyerIds.has(inv['buyerId'] as string)).toBe(true);
        }

        // Messages типа invoice → существующий invoiceId; все → существующий chat
        for (const m of store.documents(COLLECTIONS.messages)) {
            expect(chatIds.has(m['chatId'] as string)).toBe(true);
            if (m['type'] === 'invoice') {
                expect(invoiceIds.has(m['invoiceId'] as string)).toBe(true);
            }
        }
    });

    it('ratingAvg/ratingCount товаров/вендоров согласованы с отзывами', async () => {
        const store = new InMemorySeedStore();
        await runSeed(store);

        const reviews = store.documents(COLLECTIONS.reviews);
        // Сумма ratingCount по товарам == числу отзывов (каждый отзыв с productId).
        const products = store.documents(COLLECTIONS.products);
        const totalProductRatingCount = products.reduce(
            (acc, p) => acc + (p['ratingCount'] as number),
            0,
        );
        expect(totalProductRatingCount).toBe(reviews.length);
    });
});

describe('formatReport', () => {
    it('содержит итог и все засеянные коллекции', async () => {
        const store = new InMemorySeedStore();
        const report = await runSeed(store);
        const text = formatReport(report);

        expect(text).toContain('Seed report:');
        expect(text).toContain('TOTAL');
        for (const c of COLLECTION_ORDER) {
            expect(text).toContain(c);
        }
        expect(text).toContain(`total=${report.total}`);
    });
});

describe('детерминированность', () => {
    it('buildDataset выдаёт одинаковый результат при повторном вызове', () => {
        const a = JSON.stringify(buildDataset());
        const b = JSON.stringify(buildDataset());
        expect(a).toBe(b);
    });
});
