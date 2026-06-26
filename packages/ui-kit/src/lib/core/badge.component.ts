import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatChip } from '@angular/material/chips';

export type BadgeTone = 'accent' | 'soft' | 'success' | 'danger' | 'neutral';

const TONE: Record<BadgeTone, string> = {
    accent: 'bh-badge-accent',
    soft: 'bh-badge-soft',
    success: 'bh-badge-success',
    danger: 'bh-badge-danger',
    neutral: 'bh-badge-neutral',
};

/**
 * Badge — статичный статус/промо-пилл (Sale/-20%, в наличии, старая цена) на
 * официальном `mat-chip`. Тона перекрашивают чип через системные токены
 * --mat-chip-* (контейнер/текст), ripple отключён — это не интерактивный чип.
 */
@Component({
    selector: 'bh-badge',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatChip],
    template: `
        <mat-chip [class]="classes()" [disableRipple]="true">
            <ng-content />
        </mat-chip>
    `,
    styles: `
        :host {
            display: inline-flex;
        }
        .bh-badge {
            --mat-chip-container-height: 24px;
            --mat-chip-container-shape-radius: var(--radius-sm);
            font-family: var(--font-body);
            font-weight: 600;
            font-size: var(--fs-12);
        }
        .bh-badge-accent {
            --mat-chip-elevated-container-color: rgb(var(--color-accent));
            --mat-chip-label-text-color: rgb(var(--color-text-on-accent));
        }
        .bh-badge-soft {
            --mat-chip-elevated-container-color: rgb(var(--color-accent) / 0.16);
            --mat-chip-label-text-color: rgb(var(--color-accent));
        }
        .bh-badge-success {
            --mat-chip-elevated-container-color: rgb(var(--color-success) / 0.18);
            --mat-chip-label-text-color: rgb(var(--color-success));
        }
        .bh-badge-danger {
            --mat-chip-elevated-container-color: rgb(var(--color-danger) / 0.18);
            --mat-chip-label-text-color: rgb(var(--color-danger));
        }
        .bh-badge-neutral {
            --mat-chip-elevated-container-color: rgb(var(--color-surface-chip));
            --mat-chip-label-text-color: rgb(var(--color-text-secondary));
        }
    `,
})
export class BadgeComponent {
    readonly tone = input<BadgeTone>('accent');

    protected readonly classes = computed(() => `bh-badge ${TONE[this.tone()]}`);
}
