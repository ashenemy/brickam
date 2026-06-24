import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BadgeComponent } from '@brickam/ui-kit';
import { WishlistStore } from './wishlist.store';

/**
 * Ссылка на вишлист в шелле: иконка-сердце + бейдж-счётчик (count из стора).
 * Вынесено в инлайн-шаблон компонента (внешний app.html не парсит интерполяции).
 */
@Component({
    selector: 'app-wishlist-badge',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterModule, BadgeComponent],
    template: `
        <a
            href="/wishlist"
            routerLink="/wishlist"
            aria-label="Wishlist"
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
                <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"
                />
            </svg>
            @if (count() > 0) {
                <span class="absolute -right-2 -top-2">
                    <bh-badge tone="accent">{{ count() }}</bh-badge>
                </span>
            }
        </a>
    `,
})
export class WishlistBadgeComponent {
    private readonly store = inject(WishlistStore);
    protected readonly count = this.store.count;
}
