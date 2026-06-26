import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar, MatToolbarRow } from '@angular/material/toolbar';
import { IconButtonComponent } from '../core/icon-button.component';
import { LogoComponent } from '../core/logo.component';
import { SearchBarComponent } from '../forms/search-bar.component';

/**
 * Navbar — шапка маркетплейса BRICK на официальном `mat-toolbar` (многострочный):
 * логотип, навигация, корзина/язык/валюта, затем «Categories» + поиск. Иконки —
 * mat-icon, кнопки — matButton/matIconButton. Адаптив (mobile-first): на узких
 * экранах навигация сворачивается в бургер-меню, строки переносятся, без overflow.
 */
@Component({
    selector: 'bh-navbar',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatToolbar,
        MatToolbarRow,
        MatButton,
        MatIcon,
        LogoComponent,
        IconButtonComponent,
        SearchBarComponent,
    ],
    template: `
        <mat-toolbar class="bh-navbar rounded-2xl bg-[var(--glass-fill)] p-4 backdrop-blur-glass shadow-glass sm:p-7">
            <!-- Row 1 -->
            <mat-toolbar-row class="bh-row flex items-center gap-4 sm:gap-8">
                <a
                    class="shrink-0 cursor-pointer rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                    href="#"
                    aria-label="Home"
                    (click)="onLogo($event)"
                >
                    <bh-logo [height]="32" />
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

                <div class="ml-auto flex items-center gap-3 lg:ml-0 sm:gap-4">
                    <button matButton class="bh-lang" (click)="langChange.emit()">
                        {{ lang() }} · {{ currency() }}
                    </button>

                    <div class="relative">
                        <bh-icon-button variant="plain" [size]="44" ariaLabel="Cart" (clicked)="cart.emit()">
                            <mat-icon>shopping_cart</mat-icon>
                        </bh-icon-button>
                        @if (cartCount() > 0) {
                            <span
                                class="pointer-events-none absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-pill bg-accent px-1.5 text-white"
                                style="font: var(--type-meta); font-size: 11px"
                                [attr.aria-label]="cartCount() + ' items in cart'"
                                >{{ cartCount() }}</span
                            >
                        }
                    </div>

                    <bh-icon-button
                        class="lg:hidden"
                        variant="plain"
                        [size]="44"
                        [active]="menuOpen()"
                        ariaLabel="Toggle navigation menu"
                        (clicked)="toggleMenu()"
                    >
                        <mat-icon>{{ menuOpen() ? 'close' : 'menu' }}</mat-icon>
                    </bh-icon-button>
                </div>
            </mat-toolbar-row>

            <!-- Collapsible nav (mobile) -->
            @if (menuOpen()) {
                <mat-toolbar-row class="bh-row mt-4 flex flex-col items-start gap-3 lg:hidden">
                    <nav class="flex w-full flex-col gap-3" aria-label="Primary mobile">
                        @for (item of navItems(); track item) {
                            <a
                                class="cursor-pointer rounded-sm py-1 transition-colors duration-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                                [class.text-accent]="item === active()"
                                [class.text-text-primary]="item !== active()"
                                href="#"
                                style="font: var(--type-label)"
                                (click)="onNav($event, item)"
                                >{{ item }}</a
                            >
                        }
                    </nav>
                </mat-toolbar-row>
            }

            <!-- Row 2 -->
            <mat-toolbar-row class="bh-row mt-5 flex flex-col items-stretch gap-3 sm:mt-6 md:flex-row md:items-center md:gap-5">
                <button matButton="filled" class="bh-categories h-14 gap-3 sm:h-16" (click)="categories.emit()">
                    <mat-icon>menu</mat-icon>
                    Categories
                </button>

                <bh-search-bar
                    class="block min-w-0 flex-1"
                    [hasIcon]="true"
                    [placeholder]="searchPlaceholder()"
                    (submitted)="search.emit($event)"
                >
                    <mat-icon slot="icon">search</mat-icon>
                    <mat-icon slot="go">arrow_forward</mat-icon>
                </bh-search-bar>
            </mat-toolbar-row>
        </mat-toolbar>
    `,
    styles: `
        /* mat-toolbar как glass-оболочка: сбрасываем фон/высоту/паддинги Material,
           строки растягиваем по высоте контента (2-рядный бренд-хедер). */
        .bh-navbar.mat-toolbar {
            display: block;
            height: auto;
            background: var(--glass-fill);
            color: rgb(var(--color-text-primary));
        }
        .bh-navbar .bh-row.mat-toolbar-row {
            height: auto;
            padding: 0;
            white-space: normal;
        }
        .bh-lang.mat-mdc-button {
            font-family: var(--font-display);
        }
        .bh-categories.mat-mdc-unelevated-button {
            border-radius: var(--radius-xl);
            font: var(--type-h2);
        }
    `,
})
export class NavbarComponent {
    readonly navItems = input<string[]>(['About us', 'For partners', 'Delivery', 'Payments']);
    readonly active = input<string>();
    readonly cartCount = input(0);
    readonly lang = input('EN');
    readonly currency = input('₽');
    readonly searchPlaceholder = input('Search');

    readonly nav = output<string>();
    readonly search = output<string>();
    readonly cart = output<void>();
    readonly categories = output<void>();
    readonly langChange = output<void>();

    protected readonly menuOpen = signal(false);

    protected toggleMenu(): void {
        this.menuOpen.update((open) => !open);
    }

    protected onLogo(event: Event): void {
        event.preventDefault();
        const first = this.navItems()[0];
        if (first) {
            this.nav.emit(first);
        }
    }

    protected onNav(event: Event, item: string): void {
        event.preventDefault();
        this.menuOpen.set(false);
        this.nav.emit(item);
    }
}
