import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatChip, MatChipRemove } from '@angular/material/chips';
import { MatIcon } from '@angular/material/icon';

/**
 * Tag / Chip — выбираемый фильтр или категория на официальном `mat-chip`
 * (Angular Material). Glass по умолчанию, оранжевый при выборе. Опц. счётчик и
 * удаление через официальный `matChipRemove` (a11y «из коробки»).
 */
@Component({
    selector: 'bh-tag',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatChip, MatChipRemove, MatIcon],
    template: `
        <mat-chip
            [class]="classes()"
            [attr.aria-pressed]="selected()"
            (click)="toggled.emit()"
            (removed)="removed.emit()"
        >
            <ng-content />
            @if (count() !== null && count() !== undefined) {
                <span class="opacity-70 font-normal">{{ count() }}</span>
            }
            @if (removable()) {
                <button matChipRemove [attr.aria-label]="removeLabel()" (click)="$event.stopPropagation()">
                    <mat-icon>close</mat-icon>
                </button>
            }
        </mat-chip>
    `,
    styles: `
        :host {
            display: inline-flex;
        }
        .bh-tag {
            cursor: pointer;
            user-select: none;
            font-family: var(--font-display);
            font-weight: 500;
            border-radius: var(--radius-md);
            transition: all var(--dur-base) var(--ease-soft);
        }
        /* Невыбранный — glass; выбранный — оранжевый акцент с бевелем. */
        .bh-tag.bh-tag-rest {
            background: var(--glass-fill);
            color: rgb(var(--color-text-primary));
            box-shadow: inset 0 0 0 1px var(--border-default);
        }
        .bh-tag.bh-tag-selected {
            background: rgb(var(--color-accent));
            color: rgb(var(--color-text-on-accent));
            box-shadow: var(--shadow-accent);
        }
    `,
})
export class TagComponent {
    readonly selected = input(false);
    readonly count = input<number | null>(null);
    readonly removable = input(false);
    readonly removeLabel = input('Remove');
    readonly toggled = output<void>();
    readonly removed = output<void>();

    protected readonly classes = computed(
        () => `bh-tag ${this.selected() ? 'bh-tag-selected' : 'bh-tag-rest'}`,
    );
}
