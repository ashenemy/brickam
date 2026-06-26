import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { MatOption } from '@angular/material/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect, type MatSelectChange } from '@angular/material/select';

export interface SelectOption {
    label: string;
    value: string | number;
}

type RawOption = SelectOption | string;

/**
 * BRICK Select — на официальном `mat-form-field` + `mat-select` + `mat-option`
 * (позиционирование/клавиатура/a11y/overlay «из коробки», без ручного CDK).
 * Управляется через [(value)].
 */
@Component({
    selector: 'bh-select',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatFormField, MatLabel, MatSelect, MatOption],
    template: `
        <mat-form-field appearance="outline" class="w-full">
            @if (label()) {
                <mat-label>{{ label() }}</mat-label>
            }
            <mat-select
                [value]="value()"
                [disabled]="disabled()"
                [placeholder]="placeholder()"
                (selectionChange)="onSelect($event)"
            >
                @for (o of normalized(); track o.value) {
                    <mat-option [value]="o.value">{{ o.label }}</mat-option>
                }
            </mat-select>
        </mat-form-field>
    `,
})
export class SelectComponent {
    readonly label = input<string>();
    readonly options = input<RawOption[]>([]);
    readonly placeholder = input('Select');
    readonly disabled = input(false);

    readonly value = model<string | number | undefined>(undefined);
    readonly changed = output<string | number>();

    protected readonly normalized = computed<SelectOption[]>(() =>
        this.options().map((o) => (typeof o === 'string' ? { label: o, value: o } : o)),
    );

    protected onSelect(event: MatSelectChange): void {
        const v = event.value as string | number;
        this.value.set(v);
        this.changed.emit(v);
    }
}
