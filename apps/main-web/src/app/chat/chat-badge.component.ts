import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BadgeComponent } from '@brickam/ui-kit';
import { ChatStore } from './chat.store';

/**
 * Ссылка на чат в шелле: иконка-сообщение + бейдж непрочитанных (totalUnread).
 */
@Component({
    selector: 'app-chat-badge',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterModule, BadgeComponent],
    template: `
        <a
            href="/chat"
            routerLink="/chat"
            aria-label="Chat"
            class="relative inline-flex items-center text-text-primary hover:text-accent transition-colors duration-base cursor-pointer rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
        >
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            @if (totalUnread() > 0) {
                <span class="absolute -right-2 -top-2">
                    <bh-badge tone="accent">{{ totalUnread() }}</bh-badge>
                </span>
            }
        </a>
    `,
})
export class ChatBadgeComponent {
    private readonly store = inject(ChatStore);
    protected readonly totalUnread = this.store.totalUnread;
}
