import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { GalleryComponent } from '@brickam/ui-kit';

export interface GalleryDialogData {
    images: string[];
}

/** Диалог-обёртка для лайтбокса галереи (bh-gallery): фото на весь попап. */
@Component({
    selector: 'app-gallery-dialog',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [GalleryComponent, MatIcon],
    template: `
        <div class="relative h-[85vh] max-h-[95vw] w-[85vh] max-w-[95vw]">
            <button type="button" class="bh-dialog-close" aria-label="Close" (click)="ref.close()">
                <mat-icon>close</mat-icon>
            </button>
            <bh-gallery
                class="block h-full w-full overflow-hidden rounded-lg bg-surface-card"
                [images]="data.images"
            />
        </div>
    `,
})
export class GalleryDialogComponent {
    protected readonly ref = inject(MatDialogRef<GalleryDialogComponent>);
    protected readonly data = inject<GalleryDialogData>(MAT_DIALOG_DATA);
}
