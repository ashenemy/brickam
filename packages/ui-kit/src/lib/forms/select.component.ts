import { CdkListbox, CdkOption } from '@angular/cdk/listbox';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    input,
    model,
    output,
    signal,
    viewChild,
} from '@angular/core';

export interface SelectOption {
    label: string;
    value: string | number;
}

type RawOption = SelectOption | string;

let selectUid = 0;

/**
 * BRICK Select — стилизованный дропдаун в тон тёмным glass-инпутам.
 * Перенесён с React (forms/Select.jsx). Использует @angular/cdk:
 * CdkConnectedOverlay (позиционирование/закрытие по backdrop) и CdkListbox/CdkOption
 * (role=listbox/option, клавиатура: стрелки/Home/End/typeahead, выбор).
 * Фиксы: a11y (триггер role=combobox + aria-expanded/aria-controls, нативная клавиатура),
 * корректное закрытие по Escape/клику вне, фокус-ринг.
 */
@Component({
    selector: 'bh-select',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CdkOverlayOrigin, CdkConnectedOverlay, CdkListbox, CdkOption],
    template: `
        <div class="flex flex-col gap-2 min-w-0">
            @if (label()) {
                <label [attr.for]="id" class="text-text-secondary" style="font: var(--type-product)">
                    {{ label() }}
                </label>
            }
            <div class="relative min-w-0">
                <button
                    cdkOverlayOrigin
                    #trigger="cdkOverlayOrigin"
                    #triggerEl
                    [id]="id"
                    type="button"
                    role="combobox"
                    [attr.aria-haspopup]="'listbox'"
                    [attr.aria-expanded]="open()"
                    [attr.aria-controls]="id + '-list'"
                    [disabled]="disabled()"
                    [class]="triggerClasses()"
                    (click)="toggle()"
                    (keydown.arrowDown)="onArrowOpen($event)"
                    (keydown.enter)="onArrowOpen($event)"
                >
                    <span class="truncate">{{ displayLabel() }}</span>
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="shrink-0 transition-transform duration-base ease-soft"
                        [style.transform]="open() ? 'rotate(180deg)' : 'none'"
                    >
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </button>

                <ng-template
                    cdkConnectedOverlay
                    [cdkConnectedOverlayOrigin]="trigger"
                    [cdkConnectedOverlayOpen]="open()"
                    [cdkConnectedOverlayHasBackdrop]="true"
                    cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
                    [cdkConnectedOverlayWidth]="triggerWidth()"
                    [cdkConnectedOverlayMinWidth]="triggerWidth()"
                    [cdkConnectedOverlayOffsetY]="8"
                    (backdropClick)="close()"
                    (detach)="close()"
                    (overlayKeydown)="onOverlayKeydown($event)"
                >
                    <ul
                        cdkListbox
                        [id]="id + '-list'"
                        [attr.aria-label]="label() || placeholder()"
                        [cdkListboxValue]="selectedValueArr()"
                        (cdkListboxValueChange)="onSelect($event.value)"
                        class="p-2 rounded-md bg-surface-card shadow-float max-h-[280px] overflow-y-auto outline-none"
                    >
                        @for (o of normalized(); track o.value) {
                            <li
                                [cdkOption]="o.value"
                                [class]="optionClasses(o.value === value())"
                            >
                                {{ o.label }}
                            </li>
                        }
                    </ul>
                </ng-template>
            </div>
        </div>
    `,
})
export class SelectComponent {
    readonly label = input<string>();
    readonly options = input<RawOption[]>([]);
    readonly placeholder = input('Select');
    readonly disabled = input(false);

    readonly value = model<string | number | undefined>(undefined);
    readonly changed = output<string | number>();

    protected readonly open = model(false);
    protected readonly id = `bh-select-${selectUid++}`;
    private readonly triggerEl = viewChild<ElementRef<HTMLButtonElement>>('triggerEl');
    private readonly widthSig = signal(0);

    protected triggerWidth(): number {
        return this.widthSig();
    }

    protected readonly normalized = computed<SelectOption[]>(() =>
        this.options().map((o) => (typeof o === 'string' ? { label: o, value: o } : o)),
    );

    protected readonly selectedValueArr = computed<(string | number)[]>(() => {
        const v = this.value();
        return v === undefined || v === null ? [] : [v];
    });

    protected readonly displayLabel = computed(() => {
        const found = this.normalized().find((o) => o.value === this.value());
        return found ? found.label : this.placeholder();
    });

    protected readonly triggerClasses = computed(() =>
        [
            'w-full flex items-center justify-between gap-3 h-14 px-5 min-w-0',
            'rounded-md border-0 cursor-pointer',
            'bg-[rgb(var(--color-neutral-900)/0.9)] font-input text-18',
            'shadow-[inset_0_0_0_1px_var(--border-subtle),var(--shadow-inset)]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]',
            this.value() !== undefined && this.value() !== null
                ? 'text-text-primary'
                : 'text-text-secondary',
        ].join(' '),
    );

    protected optionClasses(active: boolean): string {
        return [
            'px-3.5 py-3 rounded-sm cursor-pointer select-none',
            'transition-colors duration-fast',
            'focus:outline-none',
            active
                ? 'text-accent bg-[rgb(var(--color-accent)/0.12)]'
                : 'text-text-primary hover:bg-surface-chip',
        ].join(' ');
    }

    private syncWidth(): void {
        const el = this.triggerEl()?.nativeElement;
        if (el) this.widthSig.set(el.getBoundingClientRect().width);
    }

    protected toggle(): void {
        if (this.disabled()) return;
        if (!this.open()) this.syncWidth();
        this.open.update((o) => !o);
    }

    protected onArrowOpen(event: Event): void {
        if (this.disabled() || this.open()) return;
        event.preventDefault();
        this.syncWidth();
        this.open.set(true);
    }

    protected close(): void {
        this.open.set(false);
    }

    protected onOverlayKeydown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            this.close();
        }
    }

    protected onSelect(values: readonly (string | number)[]): void {
        const v = values[0];
        if (v === undefined) return;
        this.value.set(v);
        this.changed.emit(v);
        this.close();
    }
}
