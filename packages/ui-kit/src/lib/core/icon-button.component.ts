import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type IconButtonVariant = 'accent' | 'glass' | 'plain';
export type IconButtonRounded = 'lg' | 'md' | 'pill';

const ROUNDED: Record<IconButtonRounded, string> = {
    lg: 'rounded-lg',
    md: 'rounded-md',
    pill: 'rounded-pill',
};

/**
 * IconButton — круглый/скруглённый держатель действия (корзина, поиск, закрыть).
 * Перенесён с React (core/IconButton.jsx). accent — оранжевая go-кнопка.
 */
@Component({
    selector: 'bh-icon-button',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <button
            type="button"
            [attr.aria-label]="ariaLabel()"
            [attr.aria-pressed]="active() ? true : null"
            [disabled]="disabled()"
            [class]="classes()"
            [style.width.px]="size()"
            [style.height.px]="size()"
            (click)="clicked.emit($event)"
        >
            <ng-content />
        </button>
    `,
})
export class IconButtonComponent {
    readonly variant = input<IconButtonVariant>('glass');
    readonly size = input(48);
    readonly rounded = input<IconButtonRounded>('lg');
    readonly active = input(false);
    readonly disabled = input(false);
    readonly ariaLabel = input<string>('');
    readonly clicked = output<MouseEvent>();

    protected readonly classes = computed(() => {
        const v = this.variant();
        const accentText = this.active() ? 'text-accent' : 'text-text-primary';
        const byVariant =
            v === 'accent'
                ? 'bg-accent text-text-on-accent shadow-accent'
                : v === 'glass'
                  ? `bg-[var(--glass-fill)] ${accentText} shadow-[inset_0_0_0_0.5px_var(--border-default)] backdrop-blur-glass-sm`
                  : `bg-transparent ${accentText}`;
        return [
            'inline-flex items-center justify-center shrink-0 border-0 cursor-pointer',
            'transition-transform duration-fast ease-out active:scale-[0.92]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]',
            ROUNDED[this.rounded()],
            byVariant,
        ].join(' ');
    });
}
