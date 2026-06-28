import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { CartStore } from './cart.store';

/**
 * Ссылка на корзину в шапке: официальный matIconButton + mat-icon, счётчик —
 * лёгкий оранжевый пилл в углу. Inline-шаблон (внешний app.html не парсит интерполяции).
 */
@Component({
    selector: 'app-cart-badge',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterModule, MatIconButton, MatIcon],
    template: `
        <a
            matIconButton
            href="/cart"
            routerLink="/cart"
            aria-label="Cart"
            class="bh-icon-bordered relative"
            data-testid="nav-cart"
        >
            <mat-icon style="width: 22px; height: 22px; font-size: 22px; line-height: 22px">shopping_cart</mat-icon>
            @if (count() > 0) {
                <span
                    class="pointer-events-none absolute right-0.5 top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-pill bg-accent px-1 text-white"
                    style="font-size: 11px"
                    data-testid="cart-count"
                    >{{ count() }}</span
                >
            }
        </a>
    `,
})
export class CartBadgeComponent {
    private readonly store = inject(CartStore);
    protected readonly count = this.store.count;
}
