import { ConflictException } from '@brickam/core-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IdempotencyService } from './idempotency.service';

describe('IdempotencyService', () => {
    let repo: {
        findByKey: ReturnType<typeof vi.fn>;
        insertPending: ReturnType<typeof vi.fn>;
        markCompleted: ReturnType<typeof vi.fn>;
        deleteByKey: ReturnType<typeof vi.fn>;
    };
    let service: IdempotencyService;

    beforeEach(() => {
        repo = {
            findByKey: vi.fn(),
            insertPending: vi.fn(),
            markCompleted: vi.fn(() => Promise.resolve(null)),
            deleteByKey: vi.fn(() => Promise.resolve(true)),
        };
        service = new IdempotencyService(repo as never);
    });

    describe('fingerprint', () => {
        it('детерминирован для одинакового тела и различается при другом теле', () => {
            const a = service.fingerprint('POST', '/x', 'u1', { n: 1 });
            const b = service.fingerprint('POST', '/x', 'u1', { n: 1 });
            const c = service.fingerprint('POST', '/x', 'u1', { n: 2 });
            expect(a).toBe(b);
            expect(a).not.toBe(c);
        });
    });

    describe('begin', () => {
        it('новый ключ → proceed и вставляет pending', async () => {
            repo.findByKey.mockResolvedValue(null);
            repo.insertPending.mockResolvedValue({ key: 'k1' });

            const result = await service.begin('k1', 'u1', 'POST', '/x', { n: 1 });

            expect(result).toEqual({ proceed: true });
            expect(repo.insertPending).toHaveBeenCalledWith(
                expect.objectContaining({ key: 'k1', status: 'pending', userId: 'u1' }),
            );
        });

        it('completed + тот же fingerprint → replay сохранённым ответом', async () => {
            const fp = service.fingerprint('POST', '/x', 'u1', { n: 1 });
            repo.findByKey.mockResolvedValue({
                fingerprint: fp,
                status: 'completed',
                statusCode: 201,
                response: { id: 'a' },
            });

            const result = await service.begin('k1', 'u1', 'POST', '/x', { n: 1 });

            expect(result).toEqual({ replay: { statusCode: 201, body: { id: 'a' } } });
            expect(repo.insertPending).not.toHaveBeenCalled();
        });

        it('completed + другой fingerprint → ConflictException (keyConflict)', async () => {
            repo.findByKey.mockResolvedValue({
                fingerprint: 'other',
                status: 'completed',
                statusCode: 201,
                response: {},
            });

            await expect(service.begin('k1', 'u1', 'POST', '/x', { n: 1 })).rejects.toBeInstanceOf(
                ConflictException,
            );
        });

        it('pending → ConflictException (inProgress)', async () => {
            const fp = service.fingerprint('POST', '/x', 'u1', { n: 1 });
            repo.findByKey.mockResolvedValue({ fingerprint: fp, status: 'pending' });

            await expect(service.begin('k1', 'u1', 'POST', '/x', { n: 1 })).rejects.toBeInstanceOf(
                ConflictException,
            );
        });

        it('гонка вставки (insertPending→null) → ConflictException (inProgress)', async () => {
            repo.findByKey.mockResolvedValue(null);
            repo.insertPending.mockResolvedValue(null);

            await expect(service.begin('k1', 'u1', 'POST', '/x', { n: 1 })).rejects.toBeInstanceOf(
                ConflictException,
            );
        });

        it('replay использует 200 по умолчанию если statusCode не сохранён', async () => {
            const fp = service.fingerprint('POST', '/x', undefined, { n: 1 });
            repo.findByKey.mockResolvedValue({
                fingerprint: fp,
                status: 'completed',
                response: { id: 'a' },
            });

            const result = await service.begin('k1', undefined, 'POST', '/x', { n: 1 });

            expect(result).toEqual({ replay: { statusCode: 200, body: { id: 'a' } } });
        });
    });

    describe('complete', () => {
        it('делегирует markCompleted', async () => {
            await service.complete('k1', 201, { ok: true });
            expect(repo.markCompleted).toHaveBeenCalledWith('k1', 201, { ok: true });
        });
    });

    describe('fail', () => {
        it('делегирует deleteByKey', async () => {
            await service.fail('k1');
            expect(repo.deleteByKey).toHaveBeenCalledWith('k1');
        });
    });
});
