import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BadgeComponent } from '@brickam/ui-kit';
import { CartStore } from './cart.store';

/**
 * Ссылка на корзину в шелле: иконка-корзина + бейдж-счётчик (count из стора).
 * Инлайн-шаблон (внешний app.html не парсит интерполяции компонента).
 */
@Component({
    selector: 'app-cart-badge',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterModule, BadgeComponent],
    template: `
        <a
            href="/cart"
            routerLink="/cart"
            aria-label="Cart"
            class="relative inline-flex items-center text-text-primary hover:text-accent transition-colors duration-base cursor-pointer rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
            data-testid="nav-cart"
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
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            @if (count() > 0) {
                <span class="absolute -right-2 -top-2">
                    <bh-badge tone="accent" data-testid="cart-count">{{ count() }}</bh-badge>
                </span>
            }
        </a>
    `,
})
export class CartBadgeComponent {
    private readonly store = inject(CartStore);
    protected readonly count = this.store.count;
}
