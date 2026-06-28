import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import type { ProductDetail } from './models';
import { ProductDetailsViewComponent } from './product-details-view.component';

/** Диалог «полное описание товара» — тот же view, что и на странице /product/:slug. */
@Component({
    selector: 'app-product-dialog',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ProductDetailsViewComponent, MatIcon],
    template: `
        <div class="relative w-[90vw] max-w-[980px]">
            <button type="button" class="bh-dialog-close" aria-label="Close" (click)="ref.close()">
                <mat-icon>close</mat-icon>
            </button>
            <div class="max-h-[85vh] overflow-y-auto rounded-lg bg-surface-card p-6">
                <app-product-details-view [product]="data" />
            </div>
        </div>
    `,
})
export class ProductDialogComponent {
    protected readonly ref = inject(MatDialogRef<ProductDialogComponent>);
    protected readonly data = inject<ProductDetail>(MAT_DIALOG_DATA);
}
