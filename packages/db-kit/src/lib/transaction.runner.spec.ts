import type { Connection } from 'mongoose';
import { describe, expect, it, vi } from 'vitest';
import { MongoTransactionRunner } from './transaction.runner';

/** Стаб сессии Mongoose: withTransaction просто выполняет переданную функцию. */
const makeSession = () => ({
    withTransaction: vi.fn(async (fn: () => Promise<void>) => {
        await fn();
    }),
    endSession: vi.fn(async () => {}),
});

const makeConnection = (session: ReturnType<typeof makeSession>) =>
    ({ startSession: vi.fn(async () => session) }) as unknown as Connection;

describe('MongoTransactionRunner', () => {
    it('оборачивает работу в транзакцию и возвращает результат, session прокинут', async () => {
        const session = makeSession();
        const runner = new MongoTransactionRunner(makeConnection(session));

        const result = await runner.run(async (ctx) => {
            expect(ctx.session).toBe(session);
            return 42;
        });

        expect(result).toBe(42);
        expect(session.withTransaction).toHaveBeenCalledTimes(1);
        expect(session.endSession).toHaveBeenCalledTimes(1);
    });

    it('standalone Mongo (код 20) → фолбэк без сессии + флаг (повтор без транзакции)', async () => {
        const session = makeSession();
        session.withTransaction.mockRejectedValueOnce(
            Object.assign(new Error('Transaction numbers are only allowed on a replica set'), {
                code: 20,
            }),
        );
        const conn = makeConnection(session);
        const runner = new MongoTransactionRunner(conn);

        const ctxSeen: unknown[] = [];
        const r1 = await runner.run(async (ctx) => {
            ctxSeen.push(ctx.session);
            return 'a';
        });
        expect(r1).toBe('a');
        expect(ctxSeen.at(-1)).toBeUndefined(); // фолбэк: без сессии

        // Второй вызов уже не пытается стартовать сессию (флаг unsupported).
        (conn.startSession as ReturnType<typeof vi.fn>).mockClear();
        const r2 = await runner.run(async (ctx) => {
            ctxSeen.push(ctx.session);
            return 'b';
        });
        expect(r2).toBe('b');
        expect(conn.startSession).not.toHaveBeenCalled();
    });

    it('прочие ошибки пробрасываются (не глотаются)', async () => {
        const session = makeSession();
        session.withTransaction.mockRejectedValueOnce(new Error('write conflict'));
        const runner = new MongoTransactionRunner(makeConnection(session));

        await expect(runner.run(async () => 1)).rejects.toThrow('write conflict');
        expect(session.endSession).toHaveBeenCalledTimes(1);
    });
});
