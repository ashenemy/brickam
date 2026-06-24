import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * Tag / Chip — выбираемый фильтр или категория. Glass по умолчанию,
 * оранжевый при выборе. Опц. счётчик и удаление (×).
 * Перенесён с React (core/Tag.jsx) с фиксом a11y: настоящий <button> + клавиатура,
 * удаление вынесено в отдельную кнопку с aria-label.
 */
@Component({
    selector: 'bh-tag',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <button
            type="button"
            [class]="classes()"
            [attr.aria-pressed]="selected()"
            (click)="toggled.emit()"
        >
            <ng-content />
            @if (count() !== null && count() !== undefined) {
                <span class="opacity-70 font-normal">{{ count() }}</span>
            }
            @if (removable()) {
                <span
                    role="button"
                    tabindex="0"
                    class="ml-0.5 text-16 leading-none opacity-80 hover:opacity-100 cursor-pointer"
                    [attr.aria-label]="removeLabel()"
                    (click)="onRemove($event)"
                    (keydown.enter)="onRemove($event)"
                    (keydown.space)="onRemove($event)"
                    >×</span
                >
            }
        </button>
    `,
})
export class TagComponent {
    readonly selected = input(false);
    readonly count = input<number | null>(null);
    readonly removable = input(false);
    readonly removeLabel = input('Remove');
    readonly toggled = output<void>();
    readonly removed = output<void>();

    protected readonly classes = computed(() =>
        [
            'inline-flex items-center gap-2 h-9 px-4 rounded-md border-0',
            'font-display font-medium text-14 cursor-pointer select-none',
            'transition-all duration-base ease-soft backdrop-blur-glass-sm',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]',
            this.selected()
                ? 'bg-accent text-text-on-accent shadow-accent'
                : 'bg-[var(--glass-fill)] text-text-primary shadow-[inset_0_0_0_1px_var(--border-default)]',
        ].join(' '),
    );

    protected onRemove(event: Event): void {
        event.stopPropagation();
        event.preventDefault();
        this.removed.emit();
    }
}
