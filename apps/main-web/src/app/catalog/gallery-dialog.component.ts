import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { GalleryComponent } from '@brickam/ui-kit';

export interface GalleryDialogData {
    images: string[];
}

/** Диалог-обёртка для лайтбокса галереи (bh-gallery). */
@Component({
    selector: 'app-gallery-dialog',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [GalleryComponent, MatIconButton, MatIcon],
    template: `
        <div class="relative h-[80vh] w-[85vw] max-w-[1100px] bg-surface-card p-4">
            <button
                matIconButton
                class="absolute right-2 top-2 z-10"
                aria-label="Close"
                (click)="ref.close()"
            >
                <mat-icon>close</mat-icon>
            </button>
            <bh-gallery class="block h-full pr-10" [images]="data.images" />
        </div>
    `,
})
export class GalleryDialogComponent {
    protected readonly ref = inject(MatDialogRef<GalleryDialogComponent>);
    protected readonly data = inject<GalleryDialogData>(MAT_DIALOG_DATA);
}
