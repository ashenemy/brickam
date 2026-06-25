import { beforeEach, describe, expect, it, vi } from 'vitest';

// Моки внешних зависимостей: реального Redis нет, фабрика адаптера — заглушка.
// vi.hoisted — чтобы переменные были доступны внутри хойстнутых vi.mock.
const { duplicate, quit, createAdapterMock, adapterCtor, RedisMock } = vi.hoisted(() => {
    const quitFn = vi.fn(async () => 'OK');
    const subClient = { quit: quitFn };
    const duplicateFn = vi.fn(() => subClient);
    // Маркер-фабрика адаптера, возвращаемая createAdapter.
    const ctor = vi.fn();
    return {
        duplicate: duplicateFn,
        quit: quitFn,
        adapterCtor: ctor,
        createAdapterMock: vi.fn(() => ctor),
        // function-выражение — для работы с `new Redis(...)`.
        RedisMock: vi.fn(function MockRedis() {
            return { duplicate: duplicateFn, quit: quitFn };
        }),
    };
});

vi.mock('ioredis', () => ({ Redis: RedisMock }));
vi.mock('@socket.io/redis-adapter', () => ({ createAdapter: createAdapterMock }));

// Базовый IoAdapter мокаем так, чтобы super.createIOServer вернул фейковый сервер.
const baseCreateIOServer = vi.fn(() => ({ adapter: vi.fn() }));
vi.mock('@nestjs/platform-socket.io', () => ({
    IoAdapter: class {
        // Метод на прототипе — чтобы `super.createIOServer(...)` его находил.
        createIOServer(port: number, options?: unknown): unknown {
            return baseCreateIOServer(port, options);
        }
    },
}));

import { RedisIoAdapter } from './redis-io.adapter';

const REDIS_URL = 'redis://localhost:6379';

describe('RedisIoAdapter', () => {
    let adapter: RedisIoAdapter;

    beforeEach(() => {
        RedisMock.mockClear();
        duplicate.mockClear();
        quit.mockClear();
        createAdapterMock.mockClear();
        baseCreateIOServer.mockClear();
        baseCreateIOServer.mockReturnValue({ adapter: vi.fn() });
        adapter = new RedisIoAdapter({} as never);
    });

    it('connectToRedis создаёт pub/sub (duplicate) и фабрику адаптера', async () => {
        await adapter.connectToRedis(REDIS_URL);

        // pub-клиент создан из URL с нужными опциями.
        expect(RedisMock).toHaveBeenCalledWith(REDIS_URL, {
            lazyConnect: false,
            maxRetriesPerRequest: null,
        });
        // sub-клиент — через duplicate().
        expect(duplicate).toHaveBeenCalledTimes(1);
        // Фабрика адаптера собрана из pub/sub.
        expect(createAdapterMock).toHaveBeenCalledTimes(1);
    });

    it('createIOServer применяет Redis-адаптер к серверу после connectToRedis', async () => {
        const server = { adapter: vi.fn() };
        baseCreateIOServer.mockReturnValue(server);

        await adapter.connectToRedis(REDIS_URL);
        const result = adapter.createIOServer(3000);

        expect(baseCreateIOServer).toHaveBeenCalledTimes(1);
        expect(baseCreateIOServer.mock.calls[0]?.[0]).toBe(3000);
        expect(server.adapter).toHaveBeenCalledWith(adapterCtor);
        expect(result).toBe(server);
    });

    it('createIOServer без connectToRedis не падает и не трогает adapter()', () => {
        const server = { adapter: vi.fn() };
        baseCreateIOServer.mockReturnValue(server);

        const result = adapter.createIOServer(3000);

        expect(result).toBe(server);
        // Redis-адаптер не применялся — остаётся дефолтный in-memory.
        expect(server.adapter).not.toHaveBeenCalled();
    });

    it('close() корректно закрывает pub/sub-клиенты', async () => {
        await adapter.connectToRedis(REDIS_URL);
        await adapter.close();

        // quit вызван для pub и sub (sub — тот же мок quit).
        expect(quit).toHaveBeenCalled();
    });

    it('close() без подключения не падает', async () => {
        await expect(adapter.close()).resolves.toBeUndefined();
    });
});
