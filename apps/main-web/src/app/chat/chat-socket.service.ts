import { isPlatformBrowser } from '@angular/common';
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { RUNTIME_CONFIG } from '@brickam/config-kit/browser';
import { Subject } from 'rxjs';
import { io, type Socket } from 'socket.io-client';
import { TokenStore } from '../auth/token.store';
import type { MessageView } from './models';

/** Событие прочтения: кто прочитал сообщения в каком чате. */
export type ReadEvent = { chatId: string; userId: string };

/** Обновление счётчика непрочитанных по чату. */
export type UnreadEvent = { chatId: string; unread?: number };

/**
 * Обёртка над socket.io-client для неймспейса /chat.
 * Работает ТОЛЬКО в браузере — на сервере все методы no-op (SSR-безопасно).
 */
@Injectable({ providedIn: 'root' })
export class ChatSocketService {
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    private readonly config = inject(RUNTIME_CONFIG);
    private readonly tokenStore = inject(TokenStore);

    private socket: Socket | null = null;

    /** Входящее новое сообщение. */
    readonly messageNew$ = new Subject<MessageView>();
    /** Сообщения прочитаны участником. */
    readonly messageRead$ = new Subject<ReadEvent>();
    /** Изменился счётчик непрочитанных. */
    readonly unread$ = new Subject<UnreadEvent>();

    /** Origin API без суффикса /api. */
    private get origin(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '').replace(/\/api$/, '');
    }

    /** Подключиться к неймспейсу /chat с JWT из TokenStore. Идемпотентно. */
    connect(): void {
        if (!this.isBrowser || this.socket) {
            return;
        }
        const token = this.tokenStore.get();
        if (!token) {
            return;
        }
        const socket = io(`${this.origin}/chat`, {
            auth: { token },
            transports: ['websocket'],
        });
        socket.on('message:new', (msg: MessageView) => this.messageNew$.next(msg));
        socket.on('message:read', (evt: ReadEvent) => this.messageRead$.next(evt));
        socket.on('chat:unread', (evt: UnreadEvent) => this.unread$.next(evt));
        this.socket = socket;
    }

    /** Войти в комнату чата (для получения событий по нему). */
    join(chatId: string): void {
        if (!this.isBrowser || !this.socket) {
            return;
        }
        this.socket.emit('chat:join', { chatId });
    }

    /** Отправить сообщение через ack; резолвит созданным сообщением. */
    send(chatId: string, text: string): Promise<MessageView> {
        if (!this.isBrowser || !this.socket) {
            return Promise.reject(new Error('socket not connected'));
        }
        const socket = this.socket;
        return new Promise<MessageView>((resolve, reject) => {
            socket.emit(
                'message:send',
                { chatId, text },
                (ack: MessageView | { error: string }) => {
                    if (ack && 'error' in ack) {
                        reject(new Error(ack.error));
                    } else {
                        resolve(ack as MessageView);
                    }
                },
            );
        });
    }

    /** Аккуратно отключиться и очистить сокет. */
    disconnect(): void {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }
    }
}
