import { ChangeDetectionStrategy, Component, effect, input, model, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatError, MatFormField, MatHint, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

/**
 * BRICK Input — на официальном `mat-form-field` + `matInput`. Внутренний FormControl
 * даёт штатную Material-машинерию ошибок: внешняя строка error() ставит invalid +
 * touched, поэтому mat-error и aria-invalid работают «из коробки». Иконка — `[slot=icon]`.
 */
@Component({
    selector: 'bh-input',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ReactiveFormsModule, MatFormField, MatLabel, MatHint, MatError, MatPrefix, MatInput],
    template: `
        <mat-form-field appearance="outline" class="w-full">
            @if (label()) {
                <mat-label>{{ label() }}</mat-label>
            }
            @if (hasIcon()) {
                <span matPrefix class="inline-flex pl-3 text-text-secondary">
                    <ng-content select="[slot=icon]" />
                </span>
            }
            <input
                matInput
                [formControl]="control"
                [type]="type()"
                [placeholder]="placeholder()"
                (change)="changed.emit(control.value)"
            />
            @if (error()) {
                <mat-error>{{ error() }}</mat-error>
            } @else if (hint()) {
                <mat-hint>{{ hint() }}</mat-hint>
            }
        </mat-form-field>
    `,
})
export class InputComponent {
    readonly label = input<string>();
    readonly error = input<string>();
    readonly hint = input<string>();
    readonly type = input<string>('text');
    readonly placeholder = input('');
    readonly disabled = input(false);
    /** Передайте иконку в `[slot=icon]`, флаг включает её обёртку. */
    readonly hasIcon = input(false);

    readonly value = model<string>('');
    readonly changed = output<string>();

    // Ошибка как валидатор: переживает updateValueAndValidity (в отличие от ручного
    // setErrors, который затирается при enable()/setValue).
    protected readonly control = new FormControl('', {
        nonNullable: true,
        validators: () => (this.error() ? { external: this.error() } : null),
    });

    constructor() {
        // Ввод → модель.
        this.control.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => this.value.set(v));
        // Внешнее обновление value → контрол (без зацикливания).
        effect(() => {
            const v = this.value();
            if (this.control.value !== v) this.control.setValue(v, { emitEvent: false });
        });
        // disabled через контрол (корректно для реактивных форм).
        effect(() => {
            if (this.disabled()) this.control.disable({ emitEvent: false });
            else this.control.enable({ emitEvent: false });
        });
        // Смена error() → пересчёт валидности; touched, чтобы дефолтный
        // ErrorStateMatcher показал mat-error и поднял aria-invalid.
        effect(() => {
            this.error();
            this.control.updateValueAndValidity({ emitEvent: false });
            if (this.error()) this.control.markAsTouched();
        });
    }
}
