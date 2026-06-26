import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatCard } from '@angular/material/card';

/**
 * RoomCard — плитка «Shop by room» на официальном `mat-card`. Фото на всю площадь
 * + glass-чип-лейбл снизу слева; растянутая ссылка-таргет для навигации/a11y.
 * Адаптив: ширину/высоту задаёт раскладка (горизонтальный скролл/бенто на мобиле).
 */
@Component({
    selector: 'bh-room-card',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatCard],
    template: `
        <mat-card
            appearance="outlined"
            class="bh-room-card group relative block w-full overflow-hidden rounded-xl bg-surface-card-alt shadow-glass transition-shadow duration-base ease-soft hover:shadow-glass-hover"
            [style.height.px]="height()"
        >
            <a
                class="absolute inset-0 z-10 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                [attr.href]="href()"
                [attr.aria-label]="label()"
                (click)="cardClick.emit()"
            ></a>
            @if (image()) {
                <img
                    [src]="image()"
                    [alt]="label()"
                    class="absolute inset-0 h-full w-full object-cover transition-transform duration-slow ease-out group-hover:scale-105"
                />
            }
            <span
                class="absolute bottom-4 left-4 z-20 rounded-md bg-[var(--glass-fill)] px-[18px] py-3 text-white backdrop-blur-glass shadow-inset"
                style="font: var(--type-section); font-family: var(--font-body)"
            >
                {{ label() }}
            </span>
        </mat-card>
    `,
    styles: `
        .bh-room-card.mat-mdc-card {
            border: 0;
            padding: 0;
        }
    `,
})
export class RoomCardComponent {
    readonly image = input<string>();
    readonly label = input('Room');
    readonly height = input(320);
    readonly href = input<string>();
    readonly cardClick = output<void>();
}
