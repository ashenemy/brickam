import { buildDataset, COLLECTION_ORDER, type SeedClock } from './dataset';
import type { SeedStore } from './store';
import type { CollectionReport, SeedReport } from './types';

/**
 * Применяет весь датасет через store. Идемпотентность обеспечивается стабильными
 * `key` каждой записи: повторный прогон даёт 'updated' вместо 'inserted' и не
 * плодит дублей. Время передаётся явно через clock.
 */
export async function runSeed(store: SeedStore, clock?: SeedClock): Promise<SeedReport> {
    const dataset = buildDataset(clock);

    const byCollection: Record<string, CollectionReport> = {};
    const ensure = (name: string): CollectionReport => {
        const cur = byCollection[name] ?? { total: 0, inserted: 0, updated: 0 };
        byCollection[name] = cur;
        return cur;
    };

    let inserted = 0;
    let updated = 0;

    for (const rec of dataset) {
        const result = await store.upsert(rec.collection, rec.key, rec.doc);
        const report = ensure(rec.collection);
        report.total += 1;
        if (result === 'inserted') {
            report.inserted += 1;
            inserted += 1;
        } else {
            report.updated += 1;
            updated += 1;
        }
    }

    return { byCollection, inserted, updated, total: dataset.length };
}

/** Человекочитаемый отчёт (для CLI). */
export function formatReport(report: SeedReport): string {
    const lines: string[] = ['Seed report:', ''];
    const seen = new Set<string>();
    const order = [...COLLECTION_ORDER, ...Object.keys(report.byCollection)];
    for (const name of order) {
        if (seen.has(name)) {
            continue;
        }
        seen.add(name);
        const c = report.byCollection[name];
        if (c === undefined) {
            continue;
        }
        lines.push(
            `  ${name.padEnd(20)} total=${c.total}  inserted=${c.inserted}  updated=${c.updated}`,
        );
    }
    lines.push('');
    lines.push(
        `  TOTAL                total=${report.total}  inserted=${report.inserted}  updated=${report.updated}`,
    );
    return lines.join('\n');
}
