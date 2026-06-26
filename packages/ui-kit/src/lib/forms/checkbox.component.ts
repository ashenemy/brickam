import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { MatCheckbox, type MatCheckboxChange } from '@angular/material/checkbox';

/**
 * BRICK Checkbox — на официальном `mat-checkbox` (квадратный, оранжевый при отметке
 * через --mat-sys-primary). Управляется через [(value)].
 */
@Component({
    selector: 'bh-checkbox',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatCheckbox],
    template: `
        <mat-checkbox [checked]="value()" [disabled]="disabled()" (change)="onChange($event)">
            {{ label() }}<ng-content />
        </mat-checkbox>
    `,
})
export class CheckboxComponent {
    readonly label = input<string>();
    readonly disabled = input(false);

    readonly value = model(false);
    readonly changed = output<boolean>();

    protected onChange(event: MatCheckboxChange): void {
        this.value.set(event.checked);
        this.changed.emit(event.checked);
    }
}
