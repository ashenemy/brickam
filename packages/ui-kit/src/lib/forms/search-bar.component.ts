import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { MatButton } from '@angular/material/button';

let searchUid = 0;

/**
 * BRICK SearchBar — фирменный поиск: полупрозрачная пилюля со слотами по краям и
 * оранжевой go-кнопкой внутри справа. У Material нет «search»-примитива, поэтому
 * go-кнопка — официальный `matButton` (filled), а поле — нативный input/textarea.
 *
 * Слоты внутри пилюли: `[slot=leading]` у левого края (напр. переключатель режима),
 * `[slot=go]` — содержимое go-кнопки у правого края. `multiline` превращает input
 * в textarea на 3 строки. a11y: <form> с submit, sr-only label, aria-label на кнопке.
 */
@Component({
    selector: 'bh-search-bar',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatButton, CdkTextareaAutosize, NgClass],
    template: `
        <form class="flex min-w-0" (submit)="onSubmit($event)">
            <label [attr.for]="id" class="sr-only">{{ placeholder() }}</label>
            <span
                class="flex min-w-0 flex-1 gap-2 rounded-md bg-[rgb(var(--color-neutral-900)/0.7)] px-2 shadow-inset backdrop-blur-glass-sm focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[rgb(var(--color-accent))]"
                [ngClass]="multiline() ? 'items-start py-2' : 'items-center h-14 sm:h-16'"
            >
                <span class="inline-flex shrink-0" [class.mt-1]="multiline()">
                    <ng-content select="[slot=leading]" />
                </span>
                @if (multiline()) {
                    <textarea
                        [id]="id"
                        [value]="value()"
                        [placeholder]="placeholder()"
                        cdkTextareaAutosize
                        [cdkAutosizeMinRows]="1"
                        [cdkAutosizeMaxRows]="4"
                        class="min-w-0 flex-1 resize-none border-0 bg-transparent px-2 font-input text-18 leading-snug text-text-primary outline-none"
                        (input)="onInput($event)"
                    ></textarea>
                } @else {
                    <input
                        [id]="id"
                        [value]="value()"
                        [placeholder]="placeholder()"
                        class="min-w-0 flex-1 border-0 bg-transparent px-2 font-input text-18 text-text-primary outline-none"
                        (input)="onInput($event)"
                    />
                }
                <button matButton="filled" type="submit" aria-label="Search" class="bh-search-go shrink-0">
                    <ng-content select="[slot=go]">→</ng-content>
                </button>
            </span>
        </form>
    `,
    styles: `
        .bh-search-go {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            min-width: 48px;
            height: 48px;
            padding: 0;
            border-radius: var(--radius-sm);
            box-shadow: var(--shadow-accent);
            font-size: var(--fs-20);
        }
    `,
})
export class SearchBarComponent {
    readonly placeholder = input('Search');
    /** Многострочный режим: input → textarea на 3 строки (напр. AI-поиск). */
    readonly multiline = input(false);

    readonly value = model<string>('');
    readonly submitted = output<string>();

    protected readonly id = `bh-search-${searchUid++}`;

    protected onInput(event: Event): void {
        this.value.set((event.target as HTMLInputElement | HTMLTextAreaElement).value);
    }

    protected onSubmit(event: Event): void {
        event.preventDefault();
        this.submitted.emit(this.value());
    }
}
