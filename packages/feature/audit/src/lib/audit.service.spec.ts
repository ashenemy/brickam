import type { AuditEntry } from '@brickam/domain-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditService } from './audit.service';
import type { AuditLogsRepository } from './audit-logs.repository';

const makeDoc = (over: Record<string, unknown> = {}) => ({
    id: 'a1',
    _id: { toString: () => 'a1' },
    actorId: 'admin1',
    action: 'dispute.open',
    targetType: 'dispute',
    targetId: 'd1',
    meta: { orderId: 'o1' },
    at: new Date('2026-06-01'),
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-06-01'),
    ...over,
});

describe('AuditService', () => {
    let repo: {
        create: ReturnType<typeof vi.fn>;
        findRecent: ReturnType<typeof vi.fn>;
    };
    let service: AuditService;

    beforeEach(() => {
        repo = {
            create: vi.fn().mockResolvedValue(makeDoc()),
            findRecent: vi.fn().mockResolvedValue([]),
        };
        service = new AuditService(repo as unknown as AuditLogsRepository);
    });

    describe('record', () => {
        it('создаёт запись с at = текущая дата и переданными полями', async () => {
            const entry: AuditEntry = {
                actorId: 'admin1',
                action: 'dispute.open',
                targetType: 'dispute',
                targetId: 'd1',
                meta: { orderId: 'o1' },
            };

            await service.record(entry);

            expect(repo.create).toHaveBeenCalledTimes(1);
            const arg = repo.create.mock.calls[0][0];
            expect(arg).toMatchObject({
                actorId: 'admin1',
                action: 'dispute.open',
                targetType: 'dispute',
                targetId: 'd1',
                meta: { orderId: 'o1' },
            });
            expect(arg.at).toBeInstanceOf(Date);
        });

        it('опускает необязательные поля, если они не заданы', async () => {
            await service.record({ actorId: 'admin1', action: 'x' });
            const arg = repo.create.mock.calls[0][0];
            expect(arg).not.toHaveProperty('targetType');
            expect(arg).not.toHaveProperty('targetId');
            expect(arg).not.toHaveProperty('meta');
            expect(arg.at).toBeInstanceOf(Date);
        });
    });

    describe('list', () => {
        it('возвращает последние записи в виде контракта', async () => {
            repo.findRecent.mockResolvedValue([makeDoc(), makeDoc({ id: 'a2' })]);
            const result = await service.list(10);
            expect(repo.findRecent).toHaveBeenCalledWith(10);
            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({
                id: 'a1',
                actorId: 'admin1',
                action: 'dispute.open',
                targetType: 'dispute',
                targetId: 'd1',
                meta: { orderId: 'o1' },
            });
        });

        it('маппит запись без опциональных полей', async () => {
            repo.findRecent.mockResolvedValue([
                makeDoc({ targetType: undefined, targetId: undefined, meta: undefined }),
            ]);
            const result = await service.list(5);
            expect(result[0]).not.toHaveProperty('targetType');
            expect(result[0]).not.toHaveProperty('meta');
        });
    });
});
