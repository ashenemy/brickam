import { MIGRATIONS } from './migrations';
import type { MigrationDb, MigrationReport } from './types';

/**
 * Применяет миграции по порядку (id отсортированы). Для каждой: если id ещё НЕ
 * в журнале applied → выполняет `up(db)`, затем `markApplied`. Иначе пропускает.
 *
 * Идемпотентность гарантируется журналом `migrations`: повторный прогон находит
 * все id применёнными → всё попадает в `skipped`, `up` не вызывается.
 */
export async function runMigrations(db: MigrationDb): Promise<MigrationReport> {
    const already = await db.applied();
    const report: MigrationReport = { applied: [], skipped: [] };

    for (const migration of MIGRATIONS) {
        if (already.has(migration.id)) {
            report.skipped.push(migration.id);
            continue;
        }
        await migration.up(db);
        await db.markApplied(migration.id, migration.description);
        report.applied.push(migration.id);
    }

    return report;
}

/** Человекочитаемый отчёт (для CLI). */
export function formatReport(report: MigrationReport): string {
    const lines: string[] = ['Migration report:', ''];
    lines.push(`  applied (${report.applied.length}): ${report.applied.join(', ') || '—'}`);
    lines.push(`  skipped (${report.skipped.length}): ${report.skipped.join(', ') || '—'}`);
    return lines.join('\n');
}
