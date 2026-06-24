import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeTone = 'accent' | 'soft' | 'success' | 'danger' | 'neutral';

const TONE: Record<BadgeTone, string> = {
    accent: 'bg-accent text-text-on-accent',
    soft: 'bg-[rgb(var(--color-accent)/0.16)] text-accent',
    success: 'bg-[rgb(var(--color-success)/0.18)] text-success',
    danger: 'bg-[rgb(var(--color-danger)/0.18)] text-danger',
    neutral: 'bg-surface-chip text-text-secondary',
};

/**
 * Badge — небольшой статус/промо-пилл (Sale/-20%, в наличии, старая цена).
 * Перенесён с React (core/Badge.jsx).
 */
@Component({
    selector: 'bh-badge',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <span [class]="classes()">
            <ng-content />
        </span>
    `,
})
export class BadgeComponent {
    readonly tone = input<BadgeTone>('accent');

    protected readonly classes = computed(() =>
        [
            'inline-flex items-center gap-1 h-6 px-[10px] rounded-sm',
            'font-body font-semibold text-12 leading-none whitespace-nowrap',
            TONE[this.tone()],
        ].join(' '),
    );
}
