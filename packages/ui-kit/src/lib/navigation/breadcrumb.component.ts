import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export interface CrumbItem {
    label: string;
    href?: string;
}

/**
 * BRICK Breadcrumb — путь-навигация. Последний элемент — текущая страница
 * (белый, aria-current="page"), остальные — приглушённые ссылки.
 * Перенесён с React (navigation/Breadcrumb.jsx); цвета только через токены.
 * Фиксы a11y: <nav aria-label="Breadcrumb"> + <ol>, разделители декоративны
 * (aria-hidden), видимый focus-ring; горизонтальный скролл на мобильном.
 */
@Component({
    selector: 'bh-breadcrumb',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <nav aria-label="Breadcrumb">
            <ol class="flex items-center gap-2.5 flex-wrap overflow-x-auto m-0 p-0 list-none">
                @for (crumb of normalized(); track $index; let last = $last) {
                    <li class="flex items-center gap-2.5">
                        @if (!last && crumb.href) {
                            <a
                                [href]="crumb.href"
                                [class]="linkClasses(last)"
                                (click)="navigated.emit(crumb)"
                            >
                                {{ crumb.label }}
                            </a>
                        } @else {
                            <span
                                [class]="linkClasses(last)"
                                [attr.aria-current]="last ? 'page' : null"
                            >
                                {{ crumb.label }}
                            </span>
                        }
                        @if (!last) {
                            <span aria-hidden="true" class="text-text-tertiary select-none">/</span>
                        }
                    </li>
                }
            </ol>
        </nav>
    `,
})
export class BreadcrumbComponent {
    readonly items = input<(CrumbItem | string)[]>([]);
    readonly navigated = output<CrumbItem>();

    protected readonly normalized = computed<CrumbItem[]>(() =>
        this.items().map((it) => (typeof it === 'string' ? { label: it } : it)),
    );

    protected linkClasses(last: boolean): string {
        return [
            'whitespace-nowrap no-underline rounded-sm',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]',
            last
                ? 'font-semibold text-text-primary cursor-default'
                : 'font-normal text-text-secondary cursor-pointer hover:text-text-primary transition-colors duration-base ease-out',
        ].join(' ');
    }
}
