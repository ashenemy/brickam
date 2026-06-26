import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';

export type IconButtonVariant = 'accent' | 'glass' | 'plain';
export type IconButtonRounded = 'lg' | 'md' | 'pill';

const ROUNDED: Record<IconButtonRounded, string> = {
    lg: 'rounded-lg',
    md: 'rounded-md',
    pill: 'rounded-pill',
};

/**
 * IconButton — на официальной директиве Angular Material `matIconButton`
 * (ripple + a11y). Размер/радиус/вариант (accent-go, glass, plain) — бренд-слой
 * поверх Material. Используется для корзины, поиска, навигации, «закрыть».
 */
@Component({
    selector: 'bh-icon-button',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatIconButton],
    template: `
        <button
            matIconButton
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
    styles: `
        :host {
            display: inline-flex;
        }
        /* matIconButton по умолчанию круглый 40px — перекрываем под бренд. */
        .bh-iconbtn {
            border-radius: var(--radius-lg);
        }
        .bh-iconbtn.rounded-md {
            border-radius: var(--radius-md);
        }
        .bh-iconbtn.rounded-pill {
            border-radius: var(--radius-pill);
        }
        .bh-iconbtn-accent {
            background: rgb(var(--color-accent));
            color: rgb(var(--color-text-on-accent));
            box-shadow: var(--shadow-accent);
        }
        .bh-iconbtn-glass {
            background: var(--glass-fill);
            -webkit-backdrop-filter: blur(var(--blur-glass-sm));
            backdrop-filter: blur(var(--blur-glass-sm));
            box-shadow: inset 0 0 0 0.5px var(--border-default);
        }
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
                ? 'bh-iconbtn-accent'
                : v === 'glass'
                  ? `bh-iconbtn-glass ${accentText}`
                  : `bg-transparent ${accentText}`;
        return ['bh-iconbtn', ROUNDED[this.rounded()], byVariant].join(' ');
    });
}
