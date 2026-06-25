import { NotFoundException, ValidationException } from '@brickam/core-kit';
import { AuditServiceContract } from '@brickam/domain-kit';
import { Injectable } from '@nestjs/common';
import type { DisputeContract, DisputeStatus } from '../@types';
import type { DisputeDocument } from './dispute.schema';
import { DisputesRepository } from './disputes.repository';
import type { OpenDisputeDto } from './dto/dispute.dto';

/**
 * Сервис споров (Foundations §15, Stage 17). Покупатель/участник открывает спор,
 * админ переводит его в разбор и закрывает. Каждый переход пишется в аудит-лог
 * через `AuditServiceContract` (инжектится глобально из feature `audit`).
 * Границы feature: только kit/domain.
 */
@Injectable()
export class DisputesService {
    constructor(
        private readonly disputesRepository: DisputesRepository,
        private readonly audit: AuditServiceContract,
    ) {}

    /** Маппит документ спора в плоский контракт. */
    private toContract(doc: DisputeDocument): DisputeContract {
        const contract: DisputeContract = {
            id: doc.id ?? doc._id.toString(),
            orderId: doc.orderId,
            openedByUserId: doc.openedByUserId,
            vendorId: doc.vendorId,
            reason: doc.reason,
            status: doc.status,
            at: doc.at,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };
        if (doc.vendorOrderId !== undefined) {
            contract.vendorOrderId = doc.vendorOrderId;
        }
        if (doc.resolution !== undefined) {
            contract.resolution = doc.resolution;
        }
        return contract;
    }

    /** Загружает спор по id или бросает NotFound. */
    private async getDoc(id: string): Promise<DisputeDocument> {
        const doc = await this.disputesRepository.findById(id);
        if (!doc) {
            throw new NotFoundException('errors.disputes.notFound');
        }
        return doc;
    }

    /** Открывает спор (статус open) и пишет событие dispute.open в аудит. */
    async open(openedByUserId: string, dto: OpenDisputeDto): Promise<DisputeContract> {
        const created = await this.disputesRepository.create({
            orderId: dto.orderId,
            ...(dto.vendorOrderId !== undefined ? { vendorOrderId: dto.vendorOrderId } : {}),
            openedByUserId,
            vendorId: dto.vendorId,
            reason: dto.reason,
            status: 'open',
            at: new Date(),
        });
        const id = created.id ?? created._id.toString();
        await this.audit.record({
            actorId: openedByUserId,
            action: 'dispute.open',
            targetType: 'dispute',
            targetId: id,
            meta: { orderId: dto.orderId },
        });
        return this.toContract(created);
    }

    /** Переводит спор open → reviewing и пишет dispute.review в аудит. */
    async review(id: string, adminId: string): Promise<DisputeContract> {
        const doc = await this.getDoc(id);
        if (doc.status !== 'open') {
            throw new ValidationException('errors.disputes.invalidTransition');
        }
        const updated = await this.disputesRepository.updateById(id, { status: 'reviewing' });
        if (!updated) {
            throw new NotFoundException('errors.disputes.notFound');
        }
        await this.audit.record({
            actorId: adminId,
            action: 'dispute.review',
            targetType: 'dispute',
            targetId: id,
        });
        return this.toContract(updated);
    }

    /**
     * Закрывает спор: reviewing|open → resolved с текстом решения, пишет
     * dispute.resolve в аудит. resolve без review допустим (open → resolved).
     */
    async resolve(id: string, adminId: string, resolution: string): Promise<DisputeContract> {
        const doc = await this.getDoc(id);
        if (doc.status === 'resolved') {
            throw new ValidationException('errors.disputes.invalidTransition');
        }
        const updated = await this.disputesRepository.updateById(id, {
            status: 'resolved',
            resolution,
        });
        if (!updated) {
            throw new NotFoundException('errors.disputes.notFound');
        }
        await this.audit.record({
            actorId: adminId,
            action: 'dispute.resolve',
            targetType: 'dispute',
            targetId: id,
        });
        return this.toContract(updated);
    }

    /** Список споров (опционально по статусу). */
    async list(status?: DisputeStatus): Promise<DisputeContract[]> {
        const docs =
            status !== undefined
                ? await this.disputesRepository.findByStatus(status)
                : await this.disputesRepository.find({}, { sort: { at: -1 } });
        return docs.map((doc) => this.toContract(doc));
    }

    /** Один спор по id или NotFound. */
    async get(id: string): Promise<DisputeContract> {
        const doc = await this.getDoc(id);
        return this.toContract(doc);
    }
}
