import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';

let checkboxUid = 0;

/**
 * BRICK Checkbox — квадратный, оранжевый при отметке.
 * Перенесён с React (forms/Checkbox.jsx). Фиксы a11y: настоящий нативный
 * <input type="checkbox"> (visually-hidden, но фокусируемый/доступный),
 * связь label↔input, видимый focus-ring на визуальной коробке, поддержка клавиатуры
 * нативно (Space). Управляется через [(value)].
 */
@Component({
    selector: 'bh-checkbox',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <label
            [class]="rootClasses()"
        >
            <input
                type="checkbox"
                class="peer sr-only"
                [checked]="value()"
                [disabled]="disabled()"
                (change)="onChange($event)"
            />
            <span [class]="boxClasses()">
                @if (value()) {
                    <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        class="text-white"
                        stroke-width="3.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path d="M5 12l4.5 4.5L19 6" />
                    </svg>
                }
            </span>
            @if (label()) {
                <span class="text-text-primary" style="font: var(--type-body)">{{ label() }}</span>
            }
            <ng-content />
        </label>
    `,
})
export class CheckboxComponent {
    readonly label = input<string>();
    readonly disabled = input(false);

    readonly value = model(false);
    readonly changed = output<boolean>();

    protected readonly id = `bh-checkbox-${checkboxUid++}`;

    protected readonly rootClasses = computed(() =>
        [
            'inline-flex items-center gap-3 select-none',
            this.disabled() ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        ].join(' '),
    );

    protected readonly boxClasses = computed(() =>
        [
            'inline-flex items-center justify-center w-[22px] h-[22px] shrink-0 rounded-[6px]',
            'transition-all duration-fast ease-out',
            'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[rgb(var(--color-accent))]',
            this.value()
                ? 'bg-accent shadow-accent'
                : 'bg-transparent shadow-[inset_0_0_0_1.5px_var(--border-strong)]',
        ].join(' '),
    );

    protected onChange(event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        this.value.set(checked);
        this.changed.emit(checked);
    }
}
