import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';

let searchUid = 0;

/**
 * BRICK SearchBar — фирменный поиск: полупрозрачная пилюля + оранжевая go-кнопка.
 * Перенесён с React (forms/SearchBar.jsx). Фиксы a11y: настоящий <form> с submit,
 * связанный label (visually-hidden) для инпута, aria-label на go-кнопке,
 * видимый focus-ring на пилюле и кнопке.
 */
@Component({
    selector: 'bh-search-bar',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
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
            <button
                type="submit"
                aria-label="Search"
                class="inline-flex items-center justify-center w-16 h-16 shrink-0 rounded-xl border-0 cursor-pointer bg-accent text-text-on-accent shadow-accent text-20 transition-transform duration-fast ease-out active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
            >
                <ng-content select="[slot=go]">→</ng-content>
            </button>
        </form>
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
