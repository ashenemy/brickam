import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const SIZE: Record<ButtonSize, string> = {
    sm: 'h-9 px-4 text-12',
    md: 'h-12 px-6 text-14',
    lg: 'h-14 px-8 text-16',
};

const VARIANT: Record<ButtonVariant, string> = {
    primary: 'bg-accent text-text-on-accent shadow-accent',
    secondary:
        'bg-[var(--glass-fill)] text-text-primary shadow-[inset_0_0_0_1px_var(--border-default)] backdrop-blur-glass-sm',
    ghost: 'bg-transparent text-accent shadow-[inset_0_0_0_1px_rgb(var(--color-accent))]',
    danger: 'bg-transparent text-danger shadow-[inset_0_0_0_1px_rgb(var(--color-danger))]',
};

/**
 * BRICK Button — Poppins-лейбл, скругление 16px, glass/accent-бевели.
 * Перенесён с React (core/Button.jsx); цвета только через токены.
 */
@Component({
    selector: 'bh-button',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <button
            [attr.type]="type()"
            [disabled]="disabled()"
            [class]="classes()"
            (click)="clicked.emit($event)"
        >
            <ng-content select="[slot=start]" />
            <ng-content />
            <ng-content select="[slot=end]" />
        </button>
    `,
})
export class ButtonComponent {
    readonly variant = input<ButtonVariant>('primary');
    readonly size = input<ButtonSize>('md');
    readonly block = input(false);
    readonly disabled = input(false);
    readonly type = input<'button' | 'submit' | 'reset'>('button');
    readonly clicked = output<MouseEvent>();

    protected readonly classes = computed(() =>
        [
            'inline-flex items-center justify-center gap-2 rounded-md font-display font-medium',
            'whitespace-nowrap cursor-pointer border-0 select-none',
            'transition-transform duration-fast ease-out active:scale-[0.97]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]',
            SIZE[this.size()],
            VARIANT[this.variant()],
            this.block() ? 'w-full' : 'w-auto',
        ].join(' '),
    );
}
