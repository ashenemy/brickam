import {
    ChangeDetectionStrategy,
    Component,
    effect,
    inject,
    input,
    model,
    output,
    type TemplateRef,
    viewChild,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog, type MatDialogConfig, type MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';

let modalUid = 0;

/**
 * BRICK Modal — декларативная обёртка над официальным `MatDialog`: видимость
 * управляется через [(open)], а контент (основной + слоты header/footer) рендерится
 * официальным диалогом (overlay, FocusTrap, restoreFocus, Esc/backdrop — «из коробки»).
 * На мобиле ширина ≈92vw. Кнопка закрытия — matIconButton + mat-icon.
 */
@Component({
    selector: 'bh-modal',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatIconButton, MatIcon],
    template: `
        <ng-template #content>
            <div class="bh-modal-head">
                @if (title()) {
                    <h3 [id]="titleId" class="m-0 text-text-primary" style="font: var(--type-h1)">
                        {{ title() }}
                    </h3>
                }
                <ng-content select="[slot=header]" />
                <button matIconButton aria-label="Close" class="ml-auto" (click)="requestClose()">
                    <mat-icon>close</mat-icon>
                </button>
            </div>

            <ng-content />

            <div class="bh-modal-foot mt-6 flex justify-end gap-3 empty:hidden">
                <ng-content select="[slot=footer]" />
            </div>
        </ng-template>
    `,
    styles: `
        .bh-modal-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: var(--space-5);
        }
    `,
})
export class ModalComponent {
    private readonly dialog = inject(MatDialog);

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
    private readonly contentTpl = viewChild<TemplateRef<unknown>>('content');
    private ref: MatDialogRef<unknown> | undefined;

    constructor() {
        effect(() => {
            const isOpen = this.open();
            const tpl = this.contentTpl(); // зависимость: эффект перезапустится, когда шаблон готов
            if (isOpen && tpl) this.openDialog(tpl);
            else if (!isOpen) this.ref?.close();
        });
    }

    private openDialog(tpl: TemplateRef<unknown>): void {
        if (this.ref) return;
        // disableClose:true — закрытие по backdrop/Esc обрабатываем сами, чтобы
        // closeOnBackdrop/closeOnEscape работали независимо.
        const config: MatDialogConfig = {
            width: `min(${this.width()}px, 92vw)`,
            maxWidth: '92vw',
            maxHeight: '90vh',
            disableClose: true,
            ariaModal: true,
            panelClass: 'bh-modal-panel',
            restoreFocus: true,
        };
        if (this.title()) config.ariaLabelledBy = this.titleId;
        else if (this.ariaLabel()) config.ariaLabel = this.ariaLabel();
        this.ref = this.dialog.open(tpl, config);
        this.ref.backdropClick().subscribe(() => {
            if (this.closeOnBackdrop()) this.requestClose();
        });
        this.ref.keydownEvents().subscribe((event) => {
            if (event.key === 'Escape' && this.closeOnEscape()) this.requestClose();
        });
        this.ref.afterClosed().subscribe(() => {
            this.ref = undefined;
            if (this.open()) this.open.set(false);
            this.close.emit();
        });
    }

    protected requestClose(): void {
        this.open.set(false);
    }
}
