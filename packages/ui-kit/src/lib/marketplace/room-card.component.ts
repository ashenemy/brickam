import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * RoomCard — плитка «Shop by room». Фото на всю площадь с glass-чипом-лейблом
 * в левом нижнем углу. Картинка масштабируется при наведении.
 * Перенесён с React (marketplace/RoomCard.jsx).
 */
@Component({
    selector: 'bh-room-card',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <a
            class="group relative block w-full overflow-hidden rounded-xl bg-surface-card-alt cursor-pointer shadow-glass transition-shadow duration-base ease-soft hover:shadow-glass-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
            [style.height.px]="height()"
            [attr.href]="href()"
            [attr.aria-label]="label()"
            (click)="cardClick.emit()"
        >
            @if (image()) {
                <img
                    [src]="image()"
                    [alt]="label()"
                    class="absolute inset-0 h-full w-full object-cover transition-transform duration-slow ease-out group-hover:scale-105"
                />
            }
            <span
                class="absolute bottom-4 left-4 rounded-md bg-[var(--glass-fill)] px-[18px] py-3 font-body text-white backdrop-blur-glass shadow-inset"
                style="font: var(--type-section); font-family: var(--font-body)"
            >
                {{ label() }}
            </span>
        </a>
    `,
})
export class RoomCardComponent {
    readonly image = input<string>();
    readonly label = input('Room');
    readonly height = input(320);
    readonly href = input<string>();
    readonly cardClick = output<void>();
}
