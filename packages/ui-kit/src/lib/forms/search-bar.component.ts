import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { MatButton } from '@angular/material/button';

let searchUid = 0;

/**
 * BRICK SearchBar — фирменный поиск: полупрозрачная пилюля + оранжевая go-кнопка.
 * Композит: у Material нет «search»-примитива, поэтому go-кнопка — официальный
 * `matButton` (filled), а поле — нативный input в брендовом pill. a11y: <form> с
 * submit, связанный sr-only label, aria-label на кнопке.
 */
@Component({
    selector: 'bh-search-bar',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatButton],
    template: `
        <form class="flex items-center gap-3 min-w-0" (submit)="onSubmit($event)">
            <label [attr.for]="id" class="sr-only">{{ placeholder() }}</label>
            <span
                class="flex flex-1 items-center gap-3.5 h-16 px-7 min-w-0 rounded-xl bg-[rgb(var(--color-neutral-900)/0.7)] shadow-inset backdrop-blur-glass-sm focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[rgb(var(--color-accent))]"
            >
                @if (hasIcon()) {
                    <span class="inline-flex text-text-secondary shrink-0">
                        <ng-content select="[slot=icon]" />
                    </span>
                }
                <input
                    [id]="id"
                    [value]="value()"
                    [placeholder]="placeholder()"
                    class="flex-1 min-w-0 border-0 outline-none bg-transparent text-text-primary font-input text-18"
                    (input)="onInput($event)"
                />
            </span>
            <button matButton="filled" type="submit" aria-label="Search" class="bh-search-go">
                <ng-content select="[slot=go]">→</ng-content>
            </button>
        </form>
    `,
    styles: `
        .bh-search-go {
            width: 64px;
            min-width: 64px;
            height: 64px;
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-accent);
            font-size: var(--fs-20);
        }
    `,
})
export class SearchBarComponent {
    readonly placeholder = input('Search');
    readonly hasIcon = input(false);

    readonly value = model<string>('');
    readonly submitted = output<string>();

    protected readonly id = `bh-search-${searchUid++}`;

    protected onInput(event: Event): void {
        this.value.set((event.target as HTMLInputElement).value);
    }

    protected onSubmit(event: Event): void {
        event.preventDefault();
        this.submitted.emit(this.value());
    }
}
