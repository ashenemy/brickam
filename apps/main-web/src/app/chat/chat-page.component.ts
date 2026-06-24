import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    type OnInit,
    signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { AvatarComponent, ButtonComponent, InputComponent } from '@brickam/ui-kit';
import { ChatStore } from './chat.store';
import type { ChatView, MessageView } from './models';

/**
 * Страница чата покупателя (route /chat). Двухпанельный UI:
 * слева список диалогов, справа активный чат. Mobile-first —
 * на узких экранах одна панель с переключением. Локализация — LanguageService.
 */
@Component({
    selector: 'app-chat',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [AvatarComponent, ButtonComponent, InputComponent],
    template: `
        <section class="flex flex-col gap-6">
            <header>
                <h1 class="text-text-primary" style="font: var(--type-hero)">{{ ph('title') }}</h1>
            </header>

            <div
                class="grid h-[70vh] grid-cols-1 overflow-hidden rounded-md border border-[var(--border-subtle)] md:grid-cols-[20rem_1fr]"
            >
                <!-- Список диалогов -->
                <aside
                    class="flex-col border-[var(--border-subtle)] md:flex md:border-r"
                    [class.hidden]="activeChatId() !== null"
                    [class.flex]="activeChatId() === null"
                >
                    @if (chats().length === 0) {
                        <div
                            class="flex h-full items-center justify-center p-6 text-center text-text-secondary"
                            style="font: var(--type-product)"
                        >
                            {{ ph('emptyChats') }}
                        </div>
                    } @else {
                        <ul class="flex flex-col overflow-y-auto">
                            @for (chat of chats(); track chat.id) {
                                <li>
                                    <button
                                        type="button"
                                        (click)="select(chat.id)"
                                        data-testid="chat-item"
                                        class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-base hover:bg-surface-card-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[rgb(var(--color-accent))]"
                                        [class.bg-surface-card-alt]="chat.id === activeChatId()"
                                    >
                                        <bh-avatar [name]="counterpart(chat)" [size]="40" />
                                        <span class="flex min-w-0 flex-1 flex-col">
                                            <span
                                                class="truncate text-text-primary"
                                                style="font: var(--type-label)"
                                                >{{ counterpart(chat) }}</span
                                            >
                                            @if (chat.lastMessageAt) {
                                                <span
                                                    class="text-text-secondary"
                                                    style="font: var(--type-caption)"
                                                    >{{ time(chat.lastMessageAt) }}</span
                                                >
                                            }
                                        </span>
                                        @if (chat.unread.buyer > 0) {
                                            <span
                                                class="inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-white"
                                                style="font: var(--type-caption)"
                                                >{{ chat.unread.buyer }}</span
                                            >
                                        }
                                    </button>
                                </li>
                            }
                        </ul>
                    }
                </aside>

                <!-- Активный чат -->
                <div
                    class="flex-col"
                    [class.hidden]="activeChatId() === null"
                    [class.flex]="activeChatId() !== null"
                >
                    @if (activeChatId() === null) {
                        <div
                            class="hidden h-full items-center justify-center p-6 text-center text-text-secondary md:flex"
                            style="font: var(--type-product)"
                        >
                            {{ ph('pickChat') }}
                        </div>
                    } @else {
                        <header
                            class="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3"
                        >
                            <button
                                type="button"
                                (click)="back()"
                                aria-label="Back"
                                class="text-text-primary md:hidden"
                            >
                                &#8592;
                            </button>
                            <bh-avatar [name]="activeTitle()" [size]="32" />
                            <span class="text-text-primary" style="font: var(--type-label)">{{
                                activeTitle()
                            }}</span>
                        </header>

                        <div class="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
                            @if (messages().length === 0) {
                                <div
                                    class="flex h-full items-center justify-center text-text-secondary"
                                    style="font: var(--type-caption)"
                                >
                                    {{ ph('emptyMessages') }}
                                </div>
                            } @else {
                                @for (msg of messages(); track msg.id) {
                                    <div
                                        class="flex"
                                        [class.justify-end]="isOwn(msg)"
                                        [class.justify-start]="!isOwn(msg)"
                                    >
                                        <div
                                            class="max-w-[75%] rounded-md px-3 py-2"
                                            [class.bg-accent]="isOwn(msg)"
                                            [class.text-white]="isOwn(msg)"
                                            [class.bg-surface-card-alt]="!isOwn(msg)"
                                            [class.text-text-primary]="!isOwn(msg)"
                                            style="font: var(--type-product)"
                                        >
                                            <span class="whitespace-pre-wrap break-words">{{
                                                msg.text
                                            }}</span>
                                            <span
                                                class="mt-1 flex items-center justify-end gap-1 opacity-70"
                                                style="font: var(--type-caption)"
                                            >
                                                {{ time(msg.createdAt) }}
                                                @if (isOwn(msg) && isRead(msg)) {
                                                    <span aria-label="read">&#10003;&#10003;</span>
                                                }
                                            </span>
                                        </div>
                                    </div>
                                }
                            }
                        </div>

                        <form
                            class="flex items-end gap-2 border-t border-[var(--border-subtle)] p-3"
                            (submit)="submit($event)"
                        >
                            <span class="flex-1">
                                <bh-input
                                    [(value)]="draft"
                                    [placeholder]="ph('inputPlaceholder')"
                                />
                            </span>
                            <bh-button variant="primary" [disabled]="draft().trim().length === 0">{{
                                ph('send')
                            }}</bh-button>
                        </form>
                    }
                </div>
            </div>
        </section>
    `,
})
export class ChatPageComponent implements OnInit {
    private readonly store = inject(ChatStore);
    private readonly i18n = inject(LanguageService);
    private readonly title = inject(Title);

    protected readonly chats = this.store.chats;
    protected readonly activeChatId = this.store.activeChatId;
    protected readonly messages = this.store.messages;
    protected readonly draft = signal('');

    protected readonly activeTitle = computed(() => {
        const id = this.activeChatId();
        const chat = this.chats().find((c) => c.id === id);
        return chat ? this.counterpart(chat) : '';
    });

    ngOnInit(): void {
        this.title.setTitle(this.ph('title'));
        this.store.loadChats();
    }

    protected select(chatId: string): void {
        this.store.open(chatId);
    }

    protected back(): void {
        this.activeChatId.set(null);
    }

    protected async submit(event: Event): Promise<void> {
        event.preventDefault();
        const text = this.draft();
        if (text.trim().length === 0) {
            return;
        }
        this.draft.set('');
        await this.store.send(text);
    }

    protected isOwn(msg: MessageView): boolean {
        const self = this.store.selfId;
        return self !== null && msg.senderId === self;
    }

    protected isRead(msg: MessageView): boolean {
        // прочитано, если кто-то кроме отправителя есть в readBy
        return msg.readBy.some((id) => id !== msg.senderId);
    }

    protected counterpart(chat: ChatView): string {
        return chat.vendorId;
    }

    protected time(iso: string): string {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) {
            return '';
        }
        return d.toLocaleTimeString(this.i18n.lang(), { hour: '2-digit', minute: '2-digit' });
    }

    protected ph(key: string): string {
        const full = `chat.${key}`;
        const translated = this.i18n.t(full);
        if (translated !== full) {
            return translated;
        }
        return DEFAULTS[key] ?? key;
    }
}

const DEFAULTS: Record<string, string> = {
    title: 'Messages',
    emptyChats: 'No conversations yet',
    pickChat: 'Select a conversation',
    emptyMessages: 'No messages yet',
    inputPlaceholder: 'Type a message…',
    send: 'Send',
};
