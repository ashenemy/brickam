import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatCard } from '@angular/material/card';

/**
 * CategoryCard — плитка меню категорий на официальном `mat-card`: скруглённое фото +
 * подпись снизу (оранжевая при наведении). Мегаменю/лендинг каталога.
 */
@Component({
    selector: 'bh-category-card',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatCard],
    template: `
        <a
            class="group flex w-full cursor-pointer flex-col items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
            [attr.href]="href()"
            [attr.aria-label]="label()"
            (click)="cardClick.emit()"
        >
            <mat-card
                appearance="outlined"
                class="bh-category-card w-full overflow-hidden rounded-md bg-white transition-shadow duration-base group-hover:shadow-float"
                style="aspect-ratio: 226 / 160"
            >
                @if (image()) {
                    <img
                        [src]="image()"
                        [alt]="label()"
                        class="h-full w-full object-cover transition-transform duration-slow ease-out group-hover:scale-105"
                    />
                }
            </mat-card>
            <span
                class="text-center text-text-primary transition-colors duration-base group-hover:text-accent"
                style="font: var(--type-product); font-size: var(--fs-16)"
            >
                {{ label() }}
            </span>
        </a>
    `,
    styles: `
        .bh-category-card.mat-mdc-card {
            border: 0;
            padding: 0;
        }
    `,
})
export class CategoryCardComponent {
    readonly image = input<string>();
    readonly label = input('Category');
    readonly href = input<string>();
    readonly cardClick = output<void>();
}
