import { describe, expect, it } from 'vitest';
import { InMemoryMigrationDb } from './db';
import { INDEX_SPECS } from './index-specs';
import { MIGRATIONS } from './migrations';
import { formatReport, runMigrations } from './run-migrations';

describe('runMigrations — идемпотентность', () => {
    it('применяет 0001 один раз; повторный прогон → 0 applied, всё skipped', async () => {
        const db = new InMemoryMigrationDb();

        const first = await runMigrations(db);
        expect(first.applied).toEqual(['0001-initial-indexes']);
        expect(first.skipped).toEqual([]);

        const second = await runMigrations(db);
        expect(second.applied).toEqual([]);
        expect(second.skipped).toEqual(['0001-initial-indexes']);
    });

    it('повторный up не плодит индексы (createIndex идемпотентен)', async () => {
        const db = new InMemoryMigrationDb();
        await runMigrations(db);
        const afterFirst = db.indexes.length;
        // Принудительно повторно прогоняем up той же миграции.
        await MIGRATIONS[0]!.up(db);
        expect(db.indexes.length).toBe(afterFirst);
    });
});

describe('markApplied / applied — трекинг id', () => {
    it('markApplied добавляет id в applied и хранит description', async () => {
        const db = new InMemoryMigrationDb();
        expect((await db.applied()).size).toBe(0);

        await db.markApplied('0001-initial-indexes', 'desc');
        const applied = await db.applied();
        expect(applied.has('0001-initial-indexes')).toBe(true);
        expect(db.descriptionOf('0001-initial-indexes')).toBe('desc');
    });
});

describe('0001 создаёт ожидаемые индексы', () => {
    it('products: slug уникален, есть vendorId/categoryId/status и text-индекс', async () => {
        const db = new InMemoryMigrationDb();
        await runMigrations(db);

        expect(db.hasIndex('products', { slug: 1 })).toBe(true);
        const slug = db.indexesFor('products').find((i) => i.keys['slug'] === 1);
        expect(slug?.options?.unique).toBe(true);

        expect(db.hasIndex('products', { vendorId: 1 })).toBe(true);
        expect(db.hasIndex('products', { categoryId: 1 })).toBe(true);
        expect(db.hasIndex('products', { status: 1 })).toBe(true);

        const text = db.indexesFor('products').find((i) => Object.values(i.keys).includes('text'));
        expect(text).toBeDefined();
        expect(text?.keys['title.hy']).toBe('text');
    });

    it('применяет ровно столько индексов, сколько в INDEX_SPECS', async () => {
        const db = new InMemoryMigrationDb();
        await runMigrations(db);
        expect(db.indexes.length).toBe(INDEX_SPECS.length);
    });
});

describe('INDEX_SPECS — уникальность и TTL', () => {
    const uniqueChecks: Array<[string, Record<string, 1 | -1 | 'text'>]> = [
        ['products', { slug: 1 }],
        ['categories', { slug: 1 }],
        ['vendors', { slug: 1 }],
        ['users', { phone: 1 }],
        ['reviews', { vendorOrderId: 1 }],
        ['orders', { orderNumber: 1 }],
        ['invoices', { invoiceNumber: 1 }],
        ['subscriptions', { vendorId: 1 }],
        ['vendormembers', { vendorId: 1, userId: 1 }],
        ['pages', { slug: 1 }],
        ['platform_settings', { key: 1 }],
        ['idempotency_keys', { key: 1 }],
    ];

    it.each(uniqueChecks)('%s %o — unique', (collection, keys) => {
        const spec = INDEX_SPECS.find(
            (s) => s.collection === collection && JSON.stringify(s.keys) === JSON.stringify(keys),
        );
        expect(spec?.options?.unique).toBe(true);
    });

    it('idempotency_keys имеет TTL 86400с на createdAt', () => {
        const ttl = INDEX_SPECS.find(
            (s) => s.collection === 'idempotency_keys' && s.keys['createdAt'] === 1,
        );
        expect(ttl?.options?.expireAfterSeconds).toBe(86400);
    });

    it('exchange_rates имеет составной индекс {currency:1, fetchedAt:-1}', () => {
        expect(
            INDEX_SPECS.some(
                (s) =>
                    s.collection === 'exchange_rates' &&
                    s.keys['currency'] === 1 &&
                    s.keys['fetchedAt'] === -1,
            ),
        ).toBe(true);
    });
});

describe('formatReport', () => {
    it('содержит секции applied и skipped', async () => {
        const db = new InMemoryMigrationDb();
        const report = await runMigrations(db);
        const text = formatReport(report);
        expect(text).toContain('Migration report:');
        expect(text).toContain('applied (1)');
        expect(text).toContain('0001-initial-indexes');
    });
});

describe('MIGRATIONS', () => {
    it('отсортированы по возрастанию id и id уникальны', () => {
        const ids = MIGRATIONS.map((m) => m.id);
        expect(ids).toEqual([...ids].sort((a, b) => a.localeCompare(b)));
        expect(new Set(ids).size).toBe(ids.length);
    });
});
