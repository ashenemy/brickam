import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { MatRadioButton } from '@angular/material/radio';

let radioUid = 0;

/**
 * BRICK Radio — на официальном `mat-radio-button`. Отмечен, когда [(value)] группы
 * совпадает с optionValue; общий name группирует варианты.
 */
@Component({
    selector: 'bh-radio',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatRadioButton],
    template: `
        <mat-radio-button
            [value]="optionValue()"
            [checked]="checked()"
            [name]="name()"
            [disabled]="disabled()"
            (change)="onSelect()"
        >
            {{ label() }}<ng-content />
        </mat-radio-button>
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

    protected onSelect(): void {
        if (this.disabled()) return;
        const v = this.optionValue();
        this.value.set(v);
        this.changed.emit(v);
    }
}
