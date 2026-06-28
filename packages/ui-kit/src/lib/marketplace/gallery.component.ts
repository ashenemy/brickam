import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

/**
 * Gallery — лайтбокс изображений товара: большое фото на всю площадь, поверх него
 * слева — плавающая колонка миниатюр (position:absolute) на полупрозрачном белом
 * блюр-фоне со скроллом. Высоту/ширину задаёт контейнер (диалог). Generic (URL-строки).
 */
@Component({
    selector: 'bh-gallery',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="relative h-full w-full">
            <img [src]="current()" alt="" class="h-full w-full object-contain" />

            @if (images().length > 1) {
                <div
                    class="absolute bottom-4 left-4 top-4 flex flex-col gap-4 overflow-y-auto rounded-xl bg-white/30 p-3 opacity-30 backdrop-blur-glass-sm transition-opacity duration-base hover:opacity-100 focus-within:opacity-100"
                >
                    @for (img of images(); track $index) {
                        <button
                            type="button"
                            class="h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-md bg-surface-card-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
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
