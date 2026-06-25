import type { AuditEntry } from '@brickam/domain-kit';
import { AuditServiceContract } from '@brickam/domain-kit';
import { Injectable } from '@nestjs/common';
import type { AuditLogView } from '../@types';
import type { AuditLogDocument } from './audit-log.schema';
import { AuditLogsRepository } from './audit-logs.repository';

/**
 * Сервис аудит-лога (Foundations §15, Stage 17). Реализует
 * `AuditServiceContract`: админ-фичи пишут события через `record`. Записи
 * неизменяемы; `at` проставляется в момент записи. Границы feature: только
 * kit/domain.
 */
@Injectable()
export class AuditService implements AuditServiceContract {
    constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

    /** Маппит документ аудита в плоский контракт. */
    private toView(doc: AuditLogDocument): AuditLogView {
        const view: AuditLogView = {
            id: doc.id ?? doc._id.toString(),
            actorId: doc.actorId,
            action: doc.action,
            at: doc.at,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };
        if (doc.targetType !== undefined) {
            view.targetType = doc.targetType;
        }
        if (doc.targetId !== undefined) {
            view.targetId = doc.targetId;
        }
        if (doc.meta !== undefined) {
            view.meta = doc.meta;
        }
        return view;
    }

    /** Создаёт неизменяемую запись аудита (at = момент записи). */
    async record(entry: AuditEntry): Promise<void> {
        await this.auditLogsRepository.create({
            actorId: entry.actorId,
            action: entry.action,
            ...(entry.targetType !== undefined ? { targetType: entry.targetType } : {}),
            ...(entry.targetId !== undefined ? { targetId: entry.targetId } : {}),
            ...(entry.meta !== undefined ? { meta: entry.meta } : {}),
            at: new Date(),
        });
    }

    /** Последние записи аудита (по убыванию времени события). */
    async list(limit: number): Promise<AuditLogView[]> {
        const docs = await this.auditLogsRepository.findRecent(limit);
        return docs.map((doc) => this.toView(doc));
    }
}
