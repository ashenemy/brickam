import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { WishlistStore } from './wishlist.store';

/**
 * Ссылка на вишлист в шапке: официальный matIconButton + mat-icon (сердце),
 * счётчик — лёгкий оранжевый пилл. Inline-шаблон (внешний app.html без интерполяций).
 */
@Component({
    selector: 'app-wishlist-badge',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterModule, MatIconButton, MatIcon],
    template: `
        <a matIconButton href="/wishlist" routerLink="/wishlist" aria-label="Wishlist" class="bh-icon-bordered relative">
            <mat-icon style="width: 22px; height: 22px; font-size: 22px; line-height: 22px">{{
                count() > 0 ? 'favorite' : 'favorite_border'
            }}</mat-icon>
            @if (count() > 0) {
                <span
                    class="pointer-events-none absolute right-0.5 top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-pill bg-accent px-1 text-white"
                    style="font-size: 11px"
                    >{{ count() }}</span
                >
            }
        </a>
    `,
})
export class WishlistBadgeComponent {
    private readonly store = inject(WishlistStore);
    protected readonly count = this.store.count;
}
