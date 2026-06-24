import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';

let inputUid = 0;

/**
 * BRICK Input — текстовое поле на тёмном glass-шелле. Опц. иконка, лейбл,
 * подсказка/ошибка. Inset-pressed вид как у поисковой строки.
 * Перенесён с React (forms/Input.jsx). Фиксы a11y: связь label↔input через for/id,
 * aria-invalid/aria-describedby, видимый focus-ring на контейнере.
 */
@Component({
    selector: 'bh-input',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="flex flex-col gap-2 min-w-0">
            @if (label()) {
                <label [attr.for]="id" class="text-text-secondary" style="font: var(--type-product)">
                    {{ label() }}
                </label>
            }
            <span [class]="shellClasses()">
                @if (hasIcon()) {
                    <span class="inline-flex text-text-secondary shrink-0">
                        <ng-content select="[slot=icon]" />
                    </span>
                }
                <input
                    [id]="id"
                    [type]="type()"
                    [placeholder]="placeholder()"
                    [disabled]="disabled()"
                    [value]="value()"
                    [attr.aria-invalid]="!!error() || null"
                    [attr.aria-describedby]="error() || hint() ? id + '-msg' : null"
                    class="flex-1 min-w-0 border-0 outline-none bg-transparent text-text-primary font-input text-18 disabled:cursor-not-allowed"
                    (input)="onInput($event)"
                    (change)="changed.emit(value())"
                />
            </span>
            @if (error() || hint()) {
                <span
                    [id]="id + '-msg'"
                    [class]="error() ? 'text-danger' : 'text-text-tertiary'"
                    style="font: var(--type-caption)"
                >
                    {{ error() || hint() }}
                </span>
            }
        </div>
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

    protected readonly id = `bh-input-${inputUid++}`;

    protected readonly shellClasses = computed(() =>
        [
            'flex items-center gap-3 h-14 px-5 rounded-md min-w-0',
            'bg-[rgb(var(--color-neutral-900)/0.9)] backdrop-blur-glass-sm',
            'transition-shadow duration-fast ease-out',
            'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[rgb(var(--color-accent))]',
            this.error()
                ? 'shadow-[inset_0_0_0_1px_rgb(var(--color-danger)),var(--shadow-inset)]'
                : 'shadow-[inset_0_0_0_1px_var(--border-subtle),var(--shadow-inset)]',
        ].join(' '),
    );

    protected onInput(event: Event): void {
        this.value.set((event.target as HTMLInputElement).value);
    }
}
