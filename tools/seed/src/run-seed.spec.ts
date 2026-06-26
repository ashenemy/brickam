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
    it('товаров ~500, есть скидки, у всех уникальная data-URI SVG-обложка', async () => {
        const store = new InMemorySeedStore();
        await runSeed(store);

        const products = store.documents(COLLECTIONS.products);
        expect(products.length).toBeGreaterThanOrEqual(400);
        expect(products.length).toBeLessThanOrEqual(600);

        const discounted = products.filter((p) => p['discount'] !== undefined);
        expect(discounted.length).toBeGreaterThan(0);

        // Обложки — самодостаточные data-URI SVG (в БД), уникальные на каждый товар.
        const covers = products.map((p) => p['cover'] as { mediaType: string; url: string });
        expect(covers.every((c) => c.mediaType === 'image')).toBe(true);
        expect(covers.every((c) => c.url.startsWith('data:image/svg+xml,'))).toBe(true);
        expect(new Set(covers.map((c) => c.url)).size).toBe(products.length);
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

describe('легальные CMS-страницы', () => {
    it('сид содержит about/terms/privacy с тремя языками и status published', async () => {
        const store = new InMemorySeedStore();
        await runSeed(store);

        const pages = store.documents(COLLECTIONS.pages);
        expect(pages).toHaveLength(3);

        const bySlug = new Map(pages.map((p) => [p['slug'] as string, p]));
        for (const slug of ['about', 'terms', 'privacy']) {
            const page = bySlug.get(slug);
            expect(page).toBeDefined();
            expect(page?.['status']).toBe('published');

            for (const field of ['title', 'content', 'seoTitle', 'seoDescription']) {
                const text = page?.[field] as { hy: string; ru: string; en: string };
                expect(text.hy.length).toBeGreaterThan(0);
                expect(text.ru.length).toBeGreaterThan(0);
                expect(text.en.length).toBeGreaterThan(0);
            }
        }
    });

    it('повторный прогон апсертит страницы без дублей (идемпотентность)', async () => {
        const store = new InMemorySeedStore();
        await runSeed(store);
        await runSeed(store);
        expect(store.count(COLLECTIONS.pages)).toBe(3);
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

    it('ratingAvg/ratingCount отрецензированных товаров согласованы с отзывами', async () => {
        const store = new InMemorySeedStore();
        await runSeed(store);

        const byId = new Map(
            store.documents(COLLECTIONS.products).map((p) => [p['_id'] as string, p]),
        );

        // Ожидаемые агрегаты по отзывам (productId → avg/count).
        const sums = new Map<string, { sum: number; count: number }>();
        for (const r of store.documents(COLLECTIONS.reviews)) {
            const id = r['productId'] as string;
            const cur = sums.get(id) ?? { sum: 0, count: 0 };
            cur.sum += r['rating'] as number;
            cur.count += 1;
            sums.set(id, cur);
        }

        expect(sums.size).toBeGreaterThan(0);
        // У товаров с отзывами ratingAvg/ratingCount = агрегату (dataset вмерживает).
        for (const [id, agg] of sums) {
            const product = byId.get(id);
            expect(product).toBeDefined();
            expect(product?.['ratingCount']).toBe(agg.count);
            expect(product?.['ratingAvg']).toBe(Math.round((agg.sum / agg.count) * 10) / 10);
        }
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
