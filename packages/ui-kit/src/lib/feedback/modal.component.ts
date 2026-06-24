import { A11yModule } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    effect,
    inject,
    input,
    model,
    output,
} from '@angular/core';

let modalUid = 0;

/**
 * BRICK Modal — центрированный диалог на затемнённом скриме, тёмная glass-карточка.
 * Перенесён с React (feedback/Modal.jsx).
 *
 * a11y-фиксы поверх исходника: role="dialog" + aria-modal, FocusTrap (cdkTrapFocus
 * autoCapture), возврат фокуса на триггер, закрытие по Esc и клику на бэкдроп,
 * блокировка скролла body, aria-labelledby на заголовок.
 *
 * Контент: основной `<ng-content>`, плюс слоты `[slot=header]` и `[slot=footer]`.
 * Видимость управляется через `open` (model — поддерживает two-way `[(open)]`).
 */
@Component({
    selector: 'bh-modal',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [A11yModule],
    template: `
        @if (open()) {
            <div
                class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[rgba(0,0,0,0.6)] backdrop-blur-glass-sm"
                (click)="onBackdrop()"
            >
                <div
                    cdkTrapFocus
                    [cdkTrapFocusAutoCapture]="true"
                    role="dialog"
                    aria-modal="true"
                    [attr.aria-label]="title() ? null : ariaLabel() || null"
                    [attr.aria-labelledby]="title() ? titleId : null"
                    class="w-full max-h-[90vh] overflow-y-auto p-7 rounded-xl bg-surface-card text-text-primary shadow-[var(--shadow-float),inset_0_0_0_0.5px_var(--border-default)]"
                    [style.maxWidth.px]="width()"
                    (click)="$event.stopPropagation()"
                    (keydown.escape)="onEscape()"
                >
                    <div
                        class="flex items-start justify-between gap-4"
                        [class.mb-5]="title()"
                    >
                        @if (title()) {
                            <h3 [id]="titleId" class="m-0 text-text-primary" style="font: var(--type-h1)">
                                {{ title() }}
                            </h3>
                        }
                        <ng-content select="[slot=header]" />
                        <button
                            type="button"
                            aria-label="Close"
                            class="ml-auto flex shrink-0 items-center justify-center w-8 h-8 rounded-sm border-0 bg-surface-chip text-text-secondary text-18 leading-none cursor-pointer transition-colors duration-fast ease-out hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                            (click)="requestClose()"
                        >
                            &times;
                        </button>
                    </div>

                    <ng-content />

                    <div class="mt-6 flex justify-end gap-3 empty:hidden">
                        <ng-content select="[slot=footer]" />
                    </div>
                </div>
            </div>
        }
    `,
})
export class ModalComponent {
    private readonly document = inject(DOCUMENT);

    /** Видимость диалога. Two-way: `[(open)]`. */
    readonly open = model(false);
    readonly title = input<string>('');
    readonly width = input(480);
    /** aria-label для случая без видимого заголовка. */
    readonly ariaLabel = input<string>('');
    readonly closeOnBackdrop = input(true);
    readonly closeOnEscape = input(true);
    readonly close = output<void>();

    protected readonly titleId = `bh-modal-title-${++modalUid}`;

    private previousOverflow: string | null = null;
    private previousActive: HTMLElement | null = null;

    constructor() {
        effect(() => {
            const body = this.document.body;
            if (this.open()) {
                this.previousActive = this.document.activeElement as HTMLElement | null;
                this.previousOverflow = body.style.overflow;
                body.style.overflow = 'hidden';
            } else {
                if (this.previousOverflow !== null) {
                    body.style.overflow = this.previousOverflow;
                    this.previousOverflow = null;
                }
                this.previousActive?.focus?.();
                this.previousActive = null;
            }
        });
    }

    protected onBackdrop(): void {
        if (this.closeOnBackdrop()) {
            this.requestClose();
        }
    }

    protected onEscape(): void {
        if (this.closeOnEscape()) {
            this.requestClose();
        }
    }

    protected requestClose(): void {
        this.open.set(false);
        this.close.emit();
    }
}
