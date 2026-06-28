import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

/**
 * Gallery — лайтбокс изображений товара: большое фото справа, вертикальная
 * колонка миниатюр слева (со скроллом при нехватке места). Высоту задаёт
 * контейнер (диалог). Только изображения (URL строками); generic, без данных домена.
 */
@Component({
    selector: 'bh-gallery',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="flex h-full min-h-0 gap-3">
            @if (images().length > 1) {
                <div class="flex max-h-full shrink-0 flex-col gap-2 overflow-y-auto pr-1">
                    @for (img of images(); track $index) {
                        <button
                            type="button"
                            class="h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-md bg-surface-card-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                            style="border: 2px solid transparent"
                            [style.border-color]="
                                $index === active() ? 'rgb(var(--color-accent))' : 'transparent'
                            "
                            [attr.aria-label]="'Image ' + ($index + 1)"
                            (click)="active.set($index)"
                        >
                            <img [src]="img" alt="" class="h-full w-full object-cover" />
                        </button>
                    }
                </div>
            }
            <div class="flex min-w-0 flex-1 items-center justify-center">
                <img [src]="current()" alt="" class="max-h-full max-w-full rounded-lg object-contain" />
            </div>
        </div>
    `,
})
export class GalleryComponent {
    readonly images = input<string[]>([]);
    protected readonly active = signal(0);

    protected current(): string {
        const imgs = this.images();
        return imgs[this.active()] ?? imgs[0] ?? '';
    }
}
