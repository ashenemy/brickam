import { NotFoundException, ValidationException } from '@brickam/core-kit';
import type { AuditServiceContract } from '@brickam/domain-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DisputesRepository } from './disputes.repository';
import { DisputesService } from './disputes.service';
import type { OpenDisputeDto } from './dto/dispute.dto';

const makeDoc = (over: Record<string, unknown> = {}) => ({
    id: 'd1',
    _id: { toString: () => 'd1' },
    orderId: 'o1',
    vendorOrderId: 'vo1',
    openedByUserId: 'b1',
    vendorId: 'v1',
    reason: 'Брак',
    status: 'open',
    at: new Date('2026-06-01'),
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-06-01'),
    ...over,
});

const makeDto = (over: Partial<OpenDisputeDto> = {}): OpenDisputeDto => ({
    orderId: 'o1',
    vendorOrderId: 'vo1',
    vendorId: 'v1',
    reason: 'Брак',
    ...over,
});

describe('DisputesService', () => {
    let repo: {
        create: ReturnType<typeof vi.fn>;
        findById: ReturnType<typeof vi.fn>;
        updateById: ReturnType<typeof vi.fn>;
        findByStatus: ReturnType<typeof vi.fn>;
        find: ReturnType<typeof vi.fn>;
    };
    let audit: { record: ReturnType<typeof vi.fn> };
    let service: DisputesService;

    beforeEach(() => {
        repo = {
            create: vi.fn().mockResolvedValue(makeDoc()),
            findById: vi.fn().mockResolvedValue(makeDoc()),
            updateById: vi.fn(),
            findByStatus: vi.fn().mockResolvedValue([]),
            find: vi.fn().mockResolvedValue([]),
        };
        audit = { record: vi.fn().mockResolvedValue(undefined) };
        service = new DisputesService(
            repo as unknown as DisputesRepository,
            audit as unknown as AuditServiceContract,
        );
    });

    describe('open', () => {
        it('создаёт спор со статусом open и пишет audit dispute.open', async () => {
            const result = await service.open('b1', makeDto());

            expect(repo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderId: 'o1',
                    vendorOrderId: 'vo1',
                    openedByUserId: 'b1',
                    vendorId: 'v1',
                    reason: 'Брак',
                    status: 'open',
                }),
            );
            expect(audit.record).toHaveBeenCalledWith({
                actorId: 'b1',
                action: 'dispute.open',
                targetType: 'dispute',
                targetId: 'd1',
                meta: { orderId: 'o1' },
            });
            expect(result.status).toBe('open');
        });

        it('опускает vendorOrderId, если не задан', async () => {
            repo.create.mockResolvedValue(makeDoc({ vendorOrderId: undefined }));
            await service.open('b1', makeDto({ vendorOrderId: undefined }));
            const arg = repo.create.mock.calls[0][0];
            expect(arg).not.toHaveProperty('vendorOrderId');
        });
    });

    describe('review', () => {
        it('open → reviewing и пишет audit dispute.review', async () => {
            repo.findById.mockResolvedValue(makeDoc({ status: 'open' }));
            repo.updateById.mockResolvedValue(makeDoc({ status: 'reviewing' }));

            const result = await service.review('d1', 'admin1');

            expect(repo.updateById).toHaveBeenCalledWith('d1', { status: 'reviewing' });
            expect(audit.record).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'dispute.review', actorId: 'admin1' }),
            );
            expect(result.status).toBe('reviewing');
        });

        it('бросает NotFound, если спор не найден', async () => {
            repo.findById.mockResolvedValue(null);
            await expect(service.review('dX', 'admin1')).rejects.toBeInstanceOf(NotFoundException);
        });

        it('бросает Validation, если статус не open', async () => {
            repo.findById.mockResolvedValue(makeDoc({ status: 'resolved' }));
            await expect(service.review('d1', 'admin1')).rejects.toBeInstanceOf(
                ValidationException,
            );
        });
    });

    describe('resolve', () => {
        it('reviewing → resolved с решением и audit dispute.resolve', async () => {
            repo.findById.mockResolvedValue(makeDoc({ status: 'reviewing' }));
            repo.updateById.mockResolvedValue(
                makeDoc({ status: 'resolved', resolution: 'Возврат' }),
            );

            const result = await service.resolve('d1', 'admin1', 'Возврат');

            expect(repo.updateById).toHaveBeenCalledWith('d1', {
                status: 'resolved',
                resolution: 'Возврат',
            });
            expect(audit.record).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'dispute.resolve', actorId: 'admin1' }),
            );
            expect(result.status).toBe('resolved');
            expect(result.resolution).toBe('Возврат');
        });

        it('resolve без review допустим: open → resolved', async () => {
            repo.findById.mockResolvedValue(makeDoc({ status: 'open' }));
            repo.updateById.mockResolvedValue(
                makeDoc({ status: 'resolved', resolution: 'Скидка' }),
            );

            const result = await service.resolve('d1', 'admin1', 'Скидка');

            expect(result.status).toBe('resolved');
            expect(audit.record).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'dispute.resolve' }),
            );
        });

        it('бросает Validation при повторном resolve (уже resolved)', async () => {
            repo.findById.mockResolvedValue(makeDoc({ status: 'resolved' }));
            await expect(service.resolve('d1', 'admin1', 'x')).rejects.toBeInstanceOf(
                ValidationException,
            );
        });
    });

    describe('list', () => {
        it('по статусу делегирует findByStatus', async () => {
            repo.findByStatus.mockResolvedValue([makeDoc({ status: 'open' })]);
            const result = await service.list('open');
            expect(repo.findByStatus).toHaveBeenCalledWith('open');
            expect(result).toHaveLength(1);
        });

        it('без статуса возвращает все', async () => {
            repo.find.mockResolvedValue([makeDoc(), makeDoc({ id: 'd2' })]);
            const result = await service.list();
            expect(repo.find).toHaveBeenCalled();
            expect(result).toHaveLength(2);
        });
    });

    describe('get', () => {
        it('возвращает спор по id', async () => {
            const result = await service.get('d1');
            expect(result.id).toBe('d1');
        });

        it('бросает NotFound, если нет', async () => {
            repo.findById.mockResolvedValue(null);
            await expect(service.get('dX')).rejects.toBeInstanceOf(NotFoundException);
        });
    });
});
