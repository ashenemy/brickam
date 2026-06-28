import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import type { ProductDetail } from './models';
import { ProductDetailsViewComponent } from './product-details-view.component';

/** Диалог «полное описание товара» — тот же view, что и на странице /product/:slug. */
@Component({
    selector: 'app-product-dialog',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ProductDetailsViewComponent, MatIconButton, MatIcon],
    template: `
        <div class="relative max-h-[85vh] w-[90vw] max-w-[980px] overflow-y-auto bg-surface-card p-6">
            <button
                matIconButton
                class="absolute right-2 top-2 z-10"
                aria-label="Close"
                (click)="ref.close()"
            >
                <mat-icon>close</mat-icon>
            </button>
            <app-product-details-view [product]="data" />
        </div>
    `,
})
export class ProductDialogComponent {
    protected readonly ref = inject(MatDialogRef<ProductDialogComponent>);
    protected readonly data = inject<ProductDetail>(MAT_DIALOG_DATA);
}
