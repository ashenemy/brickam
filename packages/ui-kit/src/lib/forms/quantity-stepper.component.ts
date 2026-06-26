import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

export type QuantityStepperSize = 'sm' | 'md';

/**
 * BRICK QuantityStepper — счётчик −/+ для строк корзины. Композит: у Material нет
 * number-stepper, поэтому кнопки −/+ — официальный `matIconButton` (+`mat-icon`),
 * а контейнер — брендовый glass. Значение в role="status"/aria-live. Через [(value)].
 */
@Component({
    selector: 'bh-quantity-stepper',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatIconButton, MatIcon],
    template: `
        <span
            class="inline-flex items-center rounded-md bg-[var(--glass-fill)] shadow-[inset_0_0_0_1px_var(--border-default)] backdrop-blur-glass-sm"
            role="group"
            [attr.aria-label]="ariaLabel()"
        >
            <button
                matIconButton
                type="button"
                aria-label="Decrease quantity"
                [class]="btnClasses()"
                [disabled]="value() <= min()"
                (click)="step(-1)"
            >
                <mat-icon>remove</mat-icon>
            </button>
            <span role="status" aria-live="polite" [class]="valueClasses()">
                {{ value() }}
            </span>
            <button
                matIconButton
                type="button"
                aria-label="Increase quantity"
                [class]="btnClasses()"
                [disabled]="value() >= max()"
                (click)="step(1)"
            >
                <mat-icon>add</mat-icon>
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

    protected readonly btnClasses = computed(() =>
        this.size() === 'sm' ? 'w-9 h-9' : 'w-11 h-11',
    );

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
