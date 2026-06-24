import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';

let radioUid = 0;

/**
 * BRICK Radio — круглый селектор, оранжевая точка при выборе. Используется в группе.
 * Перенесён с React (forms/Radio.jsx). Фиксы a11y: настоящий нативный
 * <input type="radio"> с name/value (стрелочная навигация по группе нативно),
 * связь label↔input, видимый focus-ring. Управляется через [(value)] (= выбранное value группы).
 */
@Component({
    selector: 'bh-radio',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <label [class]="rootClasses()">
            <input
                type="radio"
                class="peer sr-only"
                [name]="name()"
                [checked]="checked()"
                [disabled]="disabled()"
                (change)="onSelect()"
            />
            <span [class]="ringClasses()">
                <span
                    class="w-[11px] h-[11px] rounded-full bg-accent transition-transform duration-fast ease-out"
                    [style.transform]="checked() ? 'scale(1)' : 'scale(0)'"
                ></span>
            </span>
            @if (label()) {
                <span class="text-text-primary" style="font: var(--type-body)">{{ label() }}</span>
            }
            <ng-content />
        </label>
    `,
})
export class RadioComponent {
    readonly label = input<string>();
    readonly name = input<string>(`bh-radio-${radioUid++}`);
    /** Значение этого варианта. */
    readonly optionValue = input<string | number>('');
    readonly disabled = input(false);

    /** Выбранное значение группы. Radio отмечен, когда совпадает с optionValue. */
    readonly value = model<string | number | undefined>(undefined);
    readonly changed = output<string | number>();

    protected readonly checked = computed(() => this.value() === this.optionValue());

    protected readonly rootClasses = computed(() =>
        [
            'inline-flex items-center gap-3 select-none',
            this.disabled() ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        ].join(' '),
    );

    protected readonly ringClasses = computed(() =>
        [
            'inline-flex items-center justify-center w-[22px] h-[22px] shrink-0 rounded-full',
            'transition-all duration-fast ease-out',
            'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[rgb(var(--color-accent))]',
            this.checked()
                ? 'shadow-[inset_0_0_0_1.5px_rgb(var(--color-accent))]'
                : 'shadow-[inset_0_0_0_1.5px_var(--border-strong)]',
        ].join(' '),
    );

    protected onSelect(): void {
        if (this.disabled()) return;
        const v = this.optionValue();
        this.value.set(v);
        this.changed.emit(v);
    }
}
