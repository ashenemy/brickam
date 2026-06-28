import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CatalogApiService } from './catalog-api.service';
import { GalleryDialogComponent } from './gallery-dialog.component';
import { ProductDialogComponent } from './product-dialog.component';

/**
 * Открывает попапы товара из карточки: лайтбокс галереи и полное описание.
 * Полные данные (галерея/описание) есть только в ProductDetail — грузим по slug.
 */
@Injectable({ providedIn: 'root' })
export class ProductPopupService {
    private readonly dialog = inject(MatDialog);
    private readonly api = inject(CatalogApiService);

    /** Лайтбокс галереи изображений товара. */
    openGallery(slug: string): void {
        this.api.getProduct(slug).subscribe((p) => {
            const media = p.gallery.length ? p.gallery : [p.cover];
            const images = media.filter((m) => m.mediaType === 'image').map((m) => m.url);
            this.dialog.open(GalleryDialogComponent, {
                data: { images: images.length ? images : [p.cover.url] },
                panelClass: 'bh-dialog',
                backdropClass: 'bh-dialog-backdrop',
                maxWidth: '95vw',
            });
        });
    }

    /** Попап с полным описанием (тот же компонент, что и на странице товара). */
    openDetails(slug: string): void {
        this.api.getProduct(slug).subscribe((p) => {
            this.dialog.open(ProductDialogComponent, {
                data: p,
                panelClass: 'bh-dialog',
                backdropClass: 'bh-dialog-backdrop',
                maxWidth: '95vw',
            });
        });
    }
}
