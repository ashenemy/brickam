import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { IconButtonComponent } from '@brickam/ui-kit';
import { WishlistStore } from './wishlist.store';

/**
 * Кнопка-сердечко добавления/удаления товара в вишлист.
 * Заполнено, если товар уже в вишлисте. Клик переключает состояние
 * и гасит всплытие (чтобы не открыть карточку).
 */
@Component({
    selector: 'app-wishlist-heart',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IconButtonComponent],
    template: `
        <bh-icon-button
            variant="glass"
            rounded="pill"
            [size]="size()"
            [active]="active()"
            [ariaLabel]="label()"
            (clicked)="onClick($event)"
        >
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                aria-hidden="true"
                [attr.fill]="active() ? 'currentColor' : 'none'"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"
                />
            </svg>
        </bh-icon-button>
    `,
})
export class WishlistHeartComponent {
    private readonly store = inject(WishlistStore);
    private readonly i18n = inject(LanguageService);

    readonly productId = input.required<string>();
    readonly size = input(40);

    protected readonly active = computed(() => this.store.ids().has(this.productId()));

    protected label(): string {
        const key = this.active() ? 'wishlist.remove' : 'wishlist.add';
        const translated = this.i18n.t(key);
        if (translated !== key) {
            return translated;
        }
        return this.active() ? 'Remove from wishlist' : 'Add to wishlist';
    }

    protected onClick(event: MouseEvent): void {
        event.stopPropagation();
        this.store.toggle(this.productId());
    }
}
