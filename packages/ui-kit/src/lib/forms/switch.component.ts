import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { MatSlideToggle, type MatSlideToggleChange } from '@angular/material/slide-toggle';

/**
 * BRICK Switch — на официальном `mat-slide-toggle` (тумблер настроек, оранжевый при
 * включении через --mat-sys-primary). Управляется через [(value)].
 */
@Component({
    selector: 'bh-switch',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatSlideToggle],
    template: `
        <mat-slide-toggle [checked]="value()" [disabled]="disabled()" (change)="onToggle($event)">
            {{ label() }}<ng-content />
        </mat-slide-toggle>
    `,
})
export class SwitchComponent {
    readonly label = input<string>();
    readonly disabled = input(false);

    readonly value = model(false);
    readonly changed = output<boolean>();

    protected onToggle(event: MatSlideToggleChange): void {
        this.value.set(event.checked);
        this.changed.emit(event.checked);
    }
}
