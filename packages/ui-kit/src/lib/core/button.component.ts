import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

// variant → appearance официальной директивы matButton.
const APPEARANCE: Record<ButtonVariant, 'filled' | 'outlined' | 'text'> = {
    primary: 'filled',
    secondary: 'outlined',
    ghost: 'text',
    danger: 'outlined',
};

const SIZE: Record<ButtonSize, string> = {
    sm: 'h-9 px-4 text-12',
    md: 'h-12 px-6 text-14',
    lg: 'h-14 px-8 text-16',
};

/**
 * BRICK Button — на официальной директиве Angular Material `matButton`.
 * Бренд-вид (Poppins, радиус 16, оранжевый акцент) накладывается поверх Material
 * через токены --mat-sys-* (material-bridge.css) и локальные классы.
 */
@Component({
    selector: 'bh-button',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatButton],
    host: { '[class.bh-block]': 'block()' },
    template: `
        <button
            [matButton]="appearance()"
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
    styles: `
        :host {
            display: inline-flex;
        }
        :host(.bh-block) {
            display: flex;
        }
        .bh-btn {
            border-radius: var(--radius-md);
            font-family: var(--font-display);
            font-weight: 500;
        }
        /* danger: локально перекрашиваем outlined-кнопку в danger-токен. */
        .bh-btn-danger {
            --mat-sys-primary: rgb(var(--color-danger));
        }
    `,
})
export class ButtonComponent {
    readonly variant = input<ButtonVariant>('primary');
    readonly size = input<ButtonSize>('md');
    readonly block = input(false);
    readonly disabled = input(false);
    readonly type = input<'button' | 'submit' | 'reset'>('button');
    readonly clicked = output<MouseEvent>();

    protected readonly appearance = computed(() => APPEARANCE[this.variant()]);

    protected readonly classes = computed(() =>
        [
            'bh-btn',
            SIZE[this.size()],
            this.variant() === 'danger' ? 'bh-btn-danger' : '',
            this.block() ? 'w-full' : '',
        ]
            .filter(Boolean)
            .join(' '),
    );
}
