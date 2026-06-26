import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';
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
 * Navbar — шапка маркетплейса BRICK на `mat-toolbar` (glass). Логотип (img или
 * встроенный bh-logo), основная навигация, проецируемые действия (`[slot=actions]`:
 * вишлист/корзина/юзер/язык-валюта), кнопка «Categories» с мега-меню из API,
 * поиск с переключателем режимов (обычный/AI). Адаптив: на мобиле навигация и
 * категории — в полноширинном выезжающем drawer (бургер справа, только < lg).
 */
@Component({
    selector: 'bh-navbar',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatToolbar,
        MatButton,
        MatIcon,
        LogoComponent,
        IconButtonComponent,
        SearchBarComponent,
    ],
    template: `
        <mat-toolbar class="bh-navbar block rounded-2xl bg-[var(--glass-fill)] p-4 backdrop-blur-glass shadow-glass sm:p-7">
            <!-- Row 1: logo · nav · actions -->
            <div class="flex items-center gap-4 sm:gap-8">
                <a
                    class="shrink-0 cursor-pointer rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                    href="#"
                    aria-label="Home"
                    (click)="onLogo($event)"
                >
                    @if (logoSrc()) {
                        <img [src]="logoSrc()" alt="BRICK" class="h-8 w-auto" />
                    } @else {
                        <bh-logo [height]="32" />
                    }
                </a>

                <nav class="hidden flex-1 gap-8 lg:flex lg:gap-12" aria-label="Primary">
                    @for (item of navItems(); track item) {
                        <a
                            class="cursor-pointer whitespace-nowrap transition-colors duration-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                            [class.text-accent]="item === active()"
                            [class.text-text-primary]="item !== active()"
                            href="#"
                            style="font: var(--type-label)"
                            (click)="onNav($event, item)"
                            >{{ item }}</a
                        >
                    }
                </nav>

                <div class="ml-auto flex items-center gap-3 sm:gap-4">
                    <ng-content select="[slot=actions]" />
                    <bh-icon-button
                        class="lg:hidden"
                        variant="plain"
                        [size]="44"
                        [active]="drawerOpen()"
                        ariaLabel="Toggle menu"
                        (clicked)="toggleDrawer()"
                    >
                        <mat-icon>{{ drawerOpen() ? 'close' : 'menu' }}</mat-icon>
                    </bh-icon-button>
                </div>
            </div>

            <!-- Row 2: categories + search -->
            <div class="mt-5 flex flex-col items-stretch gap-3 sm:mt-6 md:flex-row md:items-center md:gap-5">
                <button
                    matButton="filled"
                    class="bh-categories h-14 gap-3 sm:h-16"
                    [attr.aria-expanded]="megaOpen()"
                    (click)="toggleMega()"
                >
                    <mat-icon>{{ megaOpen() ? 'close' : 'category' }}</mat-icon>
                    {{ categoriesLabel() }}
                </button>

                <bh-search-bar
                    class="block min-w-0 flex-1"
                    [hasIcon]="true"
                    [placeholder]="searchPlaceholder()"
                    (submitted)="search.emit({ query: $event, mode: searchMode() })"
                >
                    <mat-icon slot="icon">{{ searchMode() === 'ai' ? 'auto_awesome' : 'search' }}</mat-icon>
                    <mat-icon slot="go">arrow_forward</mat-icon>
                </bh-search-bar>

                <!-- Переключатель режима поиска: обычный / AI -->
                <div class="flex shrink-0 rounded-md bg-[rgb(var(--color-neutral-900)/0.6)] p-1 shadow-inset" role="tablist" aria-label="Search mode">
                    <button
                        type="button"
                        role="tab"
                        [attr.aria-selected]="searchMode() === 'normal'"
                        [class]="modeBtn(searchMode() === 'normal')"
                        (click)="setMode('normal')"
                    >
                        <mat-icon class="text-18">search</mat-icon>
                    </button>
                    <button
                        type="button"
                        role="tab"
                        [attr.aria-selected]="searchMode() === 'ai'"
                        [class]="modeBtn(searchMode() === 'ai')"
                        (click)="setMode('ai')"
                    >
                        <mat-icon class="text-18">auto_awesome</mat-icon>
                    </button>
                </div>
            </div>

            <!-- Mega-menu категорий (desktop dropdown / в drawer на мобиле) -->
            @if (megaOpen() && groups().length) {
                <div class="bh-mega mt-4 grid gap-x-8 gap-y-5 rounded-xl bg-surface-card p-6 shadow-float sm:grid-cols-2 lg:grid-cols-3">
                    @for (group of groups(); track group.slug) {
                        <div class="min-w-0">
                            <button
                                type="button"
                                class="mb-2 flex items-center gap-2 text-left text-accent"
                                style="font: var(--type-label)"
                                (click)="onCategory(group.slug)"
                            >
                                @if (group.icon) {
                                    <mat-icon class="text-20">{{ group.icon }}</mat-icon>
                                }
                                {{ group.label }}
                            </button>
                            <ul class="m-0 flex list-none flex-col gap-1 p-0">
                                @for (item of group.items; track item.slug) {
                                    <li>
                                        <button
                                            type="button"
                                            class="cursor-pointer text-left text-text-secondary transition-colors duration-base hover:text-text-primary"
                                            style="font: var(--type-body); font-size: var(--fs-14)"
                                            (click)="onCategory(item.slug)"
                                        >
                                            {{ item.label }}
                                        </button>
                                    </li>
                                }
                            </ul>
                        </div>
                    }
                </div>
            }

            <!-- Мобильный drawer: навигация (полная ширина) -->
            @if (drawerOpen()) {
                <nav class="mt-4 flex flex-col gap-1 lg:hidden" aria-label="Primary mobile">
                    @for (item of navItems(); track item) {
                        <a
                            class="cursor-pointer rounded-sm py-2 transition-colors duration-base"
                            [class.text-accent]="item === active()"
                            [class.text-text-primary]="item !== active()"
                            href="#"
                            style="font: var(--type-label)"
                            (click)="onNav($event, item)"
                            >{{ item }}</a
                        >
                    }
                </nav>
            }
        </mat-toolbar>
    `,
    styles: `
        .bh-navbar.mat-toolbar {
            display: block;
            height: auto;
            background: var(--glass-fill);
            color: rgb(var(--color-text-primary));
        }
        .bh-categories.mat-mdc-unelevated-button {
            border-radius: var(--radius-xl);
            font: var(--type-h2);
        }
    `,
})
export class NavbarComponent {
    readonly navItems = input<string[]>([]);
    readonly active = input<string>();
    readonly logoSrc = input<string>();
    readonly searchPlaceholder = input('Search');
    readonly categoriesLabel = input('Categories');
    /** Группы мега-меню (корень + подкатегории), уже локализованные шеллом. */
    readonly groups = input<CategoryGroup[]>([]);

    readonly nav = output<string>();
    readonly search = output<{ query: string; mode: SearchMode }>();
    readonly categoryNavigate = output<string>();

    protected readonly drawerOpen = signal(false);
    protected readonly megaOpen = signal(false);
    protected readonly searchMode = signal<SearchMode>('normal');

    protected modeBtn(active: boolean): string {
        return [
            'inline-flex h-9 w-10 items-center justify-center rounded-sm transition-colors duration-base',
            active ? 'bg-accent text-text-on-accent shadow-accent' : 'text-text-secondary',
        ].join(' ');
    }

    protected toggleDrawer(): void {
        this.drawerOpen.update((v) => !v);
    }

    protected toggleMega(): void {
        this.megaOpen.update((v) => !v);
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
        this.drawerOpen.set(false);
        this.nav.emit(item);
    }

    protected onCategory(slug: string): void {
        this.megaOpen.set(false);
        this.drawerOpen.set(false);
        this.categoryNavigate.emit(slug);
    }
}
