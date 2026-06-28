import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { IconButtonComponent } from '../core/icon-button.component';
import { LogoComponent } from '../core/logo.component';
import { SearchBarComponent } from '../forms/search-bar.component';

/** Группа мега-меню категорий: корень + его подкатегории (уже локализовано). */
export interface CategoryGroup {
    slug: string;
    label: string;
    icon?: string;
    items: { slug: string; label: string }[];
}

export type SearchMode = 'normal' | 'ai';

/**
 * Navbar — шапка маркетплейса BRICK (glass `<header>`). Логотип, основная навигация,
 * проецируемые действия (`[slot=actions]`: вишлист/корзина/юзер/язык-валюта) и поиск с
 * переключателем режимов (обычный/AI), отцентрированный (≤1000px). Адаптив: навигация
 * на мобиле — в полноширинном drawer (бургер справа, < lg).
 */
@Component({
    selector: 'bh-navbar',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatIcon, MatTooltip, LogoComponent, IconButtonComponent, SearchBarComponent],
    template: `
        <header
            class="bh-navbar block rounded-md bg-[var(--glass-fill)] p-5 backdrop-blur-glass shadow-glass md:p-10"
            [class.bh-navbar--compact]="collapsed()"
        >
            <!-- Row 1: бургер(моб) · лого · меню · иконки — высота 40px -->
            <div class="relative flex h-10 items-center gap-4 sm:gap-8">
                <!-- Бургер — телефон и планшет (< lg), слева: открывает левый sidenav.
                     Обёртка несёт lg:hidden (на хосте bh-icon-button утилита проигрывает :host{display}). -->
                <div class="lg:hidden">
                    <bh-icon-button
                        variant="plain"
                        [size]="40"
                        ariaLabel="Open menu"
                        (clicked)="menuToggle.emit()"
                    >
                        <mat-icon>menu</mat-icon>
                    </bh-icon-button>
                </div>

                <!-- Лого: на телефоне по центру (absolute), на планшете/десктопе слева в потоке -->
                <a
                    class="absolute left-1/2 flex h-10 shrink-0 -translate-x-1/2 cursor-pointer items-center rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))] lg:static lg:translate-x-0"
                    href="#"
                    aria-label="Home"
                    (click)="onLogo($event)"
                >
                    @if (logoSrc()) {
                        <img [src]="logoSrc()" alt="BRICK" class="h-10 w-auto" />
                    } @else {
                        <bh-logo [height]="40" />
                    }
                </a>

                <!-- Меню — только десктоп (lg+); на планшете/телефоне уходит в sidenav -->
                <nav class="hidden h-10 flex-1 items-center gap-6 lg:flex lg:gap-8" aria-label="Primary">
                    @for (item of navItems(); track item) {
                        <a
                            class="cursor-pointer whitespace-nowrap font-display text-14 font-normal transition-colors duration-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                            [class.text-accent]="item === active()"
                            [class.text-text-primary]="item !== active()"
                            href="#"
                            (click)="onNav($event, item)"
                            >{{ item }}</a
                        >
                    }
                </nav>

                <!-- Иконки: язык/валюта · избранное · корзина · профиль -->
                <div class="ml-auto flex h-10 items-center gap-3 sm:gap-4">
                    <ng-content select="[slot=actions]" />
                </div>
            </div>

            <!-- Row 2: поиск (100%, ≤1000px, по центру); сворачивается при стики-скролле -->
            <div class="bh-searchrow" [class.bh-searchrow--collapsed]="collapsed()">
                <bh-search-bar
                    class="mx-auto block w-full min-w-0 max-w-[1000px]"
                    [multiline]="searchMode() === 'ai'"
                    [placeholder]="searchMode() === 'ai' ? aiPlaceholder() : searchPlaceholder()"
                    (submitted)="search.emit({ query: $event, mode: searchMode() })"
                >
                    <mat-icon slot="go" class="bh-go-icon">arrow_forward</mat-icon>

                    <!-- Переключатель режима — у левого края инпута, с тултипами -->
                    <div
                        slot="leading"
                        class="flex shrink-0 rounded-sm bg-white p-1 shadow-sm"
                        role="tablist"
                        aria-label="Search mode"
                    >
                        <button
                            type="button"
                            role="tab"
                            matTooltip="AI-поиск"
                            [attr.aria-selected]="searchMode() === 'ai'"
                            [class]="modeBtn(searchMode() === 'ai')"
                            (click)="setMode('ai')"
                        >
                            <mat-icon class="bh-mode-icon">auto_awesome</mat-icon>
                        </button>
                        <button
                            type="button"
                            role="tab"
                            matTooltip="Обычный поиск"
                            [attr.aria-selected]="searchMode() === 'normal'"
                            [class]="modeBtn(searchMode() === 'normal')"
                            (click)="setMode('normal')"
                        >
                            <mat-icon class="bh-mode-icon">search</mat-icon>
                        </button>
                    </div>
                </bh-search-bar>
            </div>
        </header>
    `,
    styles: `
        .bh-navbar {
            color: rgb(var(--color-text-primary));
            transition: padding 280ms ease;
        }
        /* Компактный режим (стики-скролл): меньше верхний/нижний паддинг. */
        .bh-navbar.bh-navbar--compact {
            padding-top: 0.75rem;
            padding-bottom: 0.75rem;
        }
        @media (min-width: 768px) {
            .bh-navbar.bh-navbar--compact {
                padding-top: 1rem;
                padding-bottom: 1rem;
            }
        }
        /* Иконки переключателя режима — крупнее и точно по центру (бокс = размеру глифа). */
        .bh-mode-icon.mat-icon {
            width: 22px;
            height: 22px;
            font-size: 22px;
            line-height: 22px;
        }
        /* Стрелка go-кнопки — чуть крупнее, глиф строго по центру бокса. */
        .bh-go-icon.mat-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 26px;
            height: 26px;
            font-size: 26px;
            line-height: 26px;
        }
        /* Строка поиска: сворачивается с анимацией при стики-скролле. */
        .bh-searchrow {
            margin-top: 2rem;
            max-height: 400px;
            opacity: 1;
            overflow: hidden;
            transition:
                max-height 280ms ease,
                opacity 200ms ease,
                margin-top 280ms ease;
        }
        @media (min-width: 640px) {
            .bh-searchrow {
                margin-top: 2.5rem;
            }
        }
        .bh-searchrow--collapsed {
            margin-top: 0;
            max-height: 0;
            opacity: 0;
            pointer-events: none;
        }
    `,
})
export class NavbarComponent {
    readonly navItems = input<string[]>([]);
    readonly active = input<string>();
    readonly logoSrc = input<string>();
    readonly searchPlaceholder = input('Search');
    /** Плейсхолдер для AI-режима (свободное описание задачи). */
    readonly aiPlaceholder = input(
        'Опишите своими словами, что вы хотите сделать — мы подберём для вас всё необходимое',
    );
    readonly categoriesLabel = input('Categories');
    /** Группы мега-меню (корень + подкатегории), уже локализованные шеллом. */
    readonly groups = input<CategoryGroup[]>([]);
    /** Свёрнутое состояние (строка поиска прячется) — шелл выставляет при стики-скролле. */
    readonly collapsed = input(false);

    readonly nav = output<string>();
    readonly search = output<{ query: string; mode: SearchMode }>();
    readonly categoryNavigate = output<string>();
    /** Клик по бургеру (телефон) — шелл открывает левый mat-sidenav. */
    readonly menuToggle = output<void>();

    protected readonly searchMode = signal<SearchMode>('ai');

    protected modeBtn(active: boolean): string {
        return [
            'inline-flex h-9 w-10 items-center justify-center rounded-sm transition-colors duration-base',
            active
                ? 'bg-accent text-text-on-accent shadow-accent'
                : 'text-[rgb(var(--color-text-inverse))]',
        ].join(' ');
    }

    protected setMode(mode: SearchMode): void {
        this.searchMode.set(mode);
    }

    protected onLogo(event: Event): void {
        event.preventDefault();
        this.nav.emit('');
    }

    protected onNav(event: Event, item: string): void {
        event.preventDefault();
        this.nav.emit(item);
    }
}
