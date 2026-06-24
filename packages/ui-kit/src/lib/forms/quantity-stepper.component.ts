import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';

export type QuantityStepperSize = 'sm' | 'md';

let stepperUid = 0;

/**
 * BRICK QuantityStepper — счётчик −/+ для строк корзины.
 * Перенесён с React (forms/QuantityStepper.jsx). Фиксы a11y: aria-label на кнопках
 * («Decrease»/«Increase»), значение в role="status"/aria-live для озвучки,
 * корректный disabled на границах min/max, видимый focus-ring, клавиатура нативно.
 * Управляется через [(value)].
 */
@Component({
    selector: 'bh-quantity-stepper',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <span
            class="inline-flex items-center rounded-md bg-[var(--glass-fill)] shadow-[inset_0_0_0_1px_var(--border-default)] backdrop-blur-glass-sm"
            role="group"
            [attr.aria-label]="ariaLabel()"
        >
            <button
                type="button"
                aria-label="Decrease quantity"
                [class]="btnClasses()"
                [disabled]="value() <= min()"
                (click)="step(-1)"
            >
                −
            </button>
            <span
                role="status"
                aria-live="polite"
                [class]="valueClasses()"
            >
                {{ value() }}
            </span>
            <button
                type="button"
                aria-label="Increase quantity"
                [class]="btnClasses()"
                [disabled]="value() >= max()"
                (click)="step(1)"
            >
                +
            </button>
        </span>
    `,
})
export class QuantityStepperComponent {
    readonly min = input(1);
    readonly max = input(99);
    readonly size = input<QuantityStepperSize>('md');
    readonly ariaLabel = input('Quantity');

    readonly value = model(1);
    readonly changed = output<number>();

    protected readonly id = `bh-stepper-${stepperUid++}`;

    protected readonly btnClasses = computed(() => {
        const dim = this.size() === 'sm' ? 'w-9 h-9' : 'w-11 h-11';
        return [
            dim,
            'inline-flex items-center justify-center border-0 bg-transparent text-20',
            'text-text-primary disabled:text-text-tertiary',
            'cursor-pointer disabled:cursor-not-allowed',
            'rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]',
        ].join(' ');
    });

    protected readonly valueClasses = computed(() =>
        [
            'min-w-[32px] text-center text-text-primary',
            this.size() === 'sm' ? 'text-14' : 'text-16',
        ].join(' '),
    );

    protected step(delta: number): void {
        const next = Math.max(this.min(), Math.min(this.max(), this.value() + delta));
        if (next === this.value()) return;
        this.value.set(next);
        this.changed.emit(next);
    }
}
