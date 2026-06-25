import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import type { Server, ServerOptions } from 'socket.io';

/** Тип фабрики адаптера Socket.IO, возвращаемой `createAdapter`. */
type AdapterConstructor = ReturnType<typeof createAdapter>;

/**
 * Socket.IO-адаптер поверх Redis pub/sub (`@socket.io/redis-adapter`). Позволяет
 * масштабировать WS-чат горизонтально: события рассылаются между несколькими
 * инстансами сервера через общий Redis. Без `connectToRedis` ведёт себя как
 * базовый in-memory `IoAdapter` (одноинстансовый режим).
 */
export class RedisIoAdapter extends IoAdapter {
    /** Фабрика адаптера; задаётся после успешного `connectToRedis`. */
    private adapterConstructor?: AdapterConstructor;

    /** pub/sub-клиенты ioredis — хранятся для graceful-shutdown. */
    private pubClient?: Redis;
    private subClient?: Redis;

    /**
     * Поднимает pub/sub ioredis-клиенты и собирает фабрику Redis-адаптера.
     * `maxRetriesPerRequest:null` обязателен для совместимости с pub/sub-режимом
     * (бесконечные ретраи без проброса ошибок в команды).
     */
    async connectToRedis(redisUrl: string): Promise<void> {
        const pubClient = new Redis(redisUrl, { lazyConnect: false, maxRetriesPerRequest: null });
        // Отдельное соединение для подписки — Redis требует разделять pub и sub.
        const subClient = pubClient.duplicate();
        this.pubClient = pubClient;
        this.subClient = subClient;
        this.adapterConstructor = createAdapter(pubClient, subClient);
    }

    /**
     * Создаёт Socket.IO-сервер через базовый `IoAdapter` и подключает к нему
     * Redis-адаптер, если он сконфигурирован. Иначе — обычный in-memory сервер.
     */
    override createIOServer(port: number, options?: ServerOptions): Server {
        const server = super.createIOServer(port, options) as Server;
        if (this.adapterConstructor) {
            server.adapter(this.adapterConstructor);
        }
        return server;
    }

    /**
     * Закрывает pub/sub-соединения (graceful-shutdown). `quit` ждёт завершения
     * незакрытых команд; ошибки глушим — на остановке они не критичны.
     */
    override async close(): Promise<void> {
        await Promise.allSettled([this.pubClient?.quit(), this.subClient?.quit()]);
    }
}
