import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { IconButtonComponent } from '../core/icon-button.component';
import { LogoComponent } from '../core/logo.component';
import { SearchBarComponent } from '../forms/search-bar.component';

/**
 * Navbar — шапка маркетплейса BRICK. Glass-оболочка: логотип, основная навигация,
 * корзина, язык/валюта, затем кнопка «Categories» + строка поиска.
 * Адаптив (mobile-first): на узких экранах навигация сворачивается в бургер-меню,
 * строки переносятся, без overflow.
 * Перенесён с React (marketplace/Navbar.jsx).
 */
@Component({
    selector: 'bh-navbar',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LogoComponent, IconButtonComponent, SearchBarComponent],
    template: `
        <header
            class="rounded-2xl bg-[var(--glass-fill)] p-4 backdrop-blur-glass shadow-glass sm:p-7"
        >
            <!-- Row 1 -->
            <div class="flex items-center gap-4 sm:gap-8">
                <a
                    class="shrink-0 cursor-pointer rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                    href="#"
                    aria-label="Home"
                    (click)="onLogo($event)"
                >
                    <bh-logo [height]="32" />
                </a>

                <nav
                    class="hidden flex-1 gap-8 lg:flex lg:gap-12"
                    aria-label="Primary"
                >
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
                    <button
                        type="button"
                        class="inline-flex h-9 items-center gap-1.5 rounded-sm px-3 text-text-primary shadow-[inset_0_0_0_1px_var(--border-default)] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                        style="font: var(--type-button); font-size: var(--fs-14)"
                        (click)="langChange.emit()"
                    >
                        {{ lang() }} · {{ currency() }}
                    </button>

                    <div class="relative">
                        <bh-icon-button variant="plain" [size]="44" ariaLabel="Cart" (clicked)="cart.emit()">
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.8"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M3 4h2l2.4 12.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.78L21 8H6" />
                                <circle cx="9.5" cy="20" r="1.3" />
                                <circle cx="17.5" cy="20" r="1.3" />
                            </svg>
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
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            aria-hidden="true"
                        >
                            <path d="M4 7h16M4 12h11M4 17h16" />
                        </svg>
                    </bh-icon-button>
                </div>
            </div>

            <!-- Collapsible nav (mobile) -->
            @if (menuOpen()) {
                <nav class="mt-4 flex flex-col gap-3 lg:hidden" aria-label="Primary mobile">
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
            }

            <!-- Row 2 -->
            <div class="mt-5 flex flex-col items-stretch gap-3 sm:mt-6 md:flex-row md:items-center md:gap-5">
                <button
                    type="button"
                    class="inline-flex h-14 shrink-0 items-center justify-center gap-3 rounded-xl border-0 bg-[rgb(var(--color-neutral-900)/0.7)] px-5 text-white shadow-inset cursor-pointer sm:h-16 sm:px-7 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                    style="font: var(--type-h2)"
                    (click)="categories.emit()"
                >
                    <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        aria-hidden="true"
                    >
                        <path d="M4 7h16M4 12h11M4 17h16" />
                    </svg>
                    Categories
                </button>

                <bh-search-bar
                    class="block min-w-0 flex-1"
                    [hasIcon]="true"
                    [placeholder]="searchPlaceholder()"
                    (submitted)="search.emit($event)"
                >
                    <svg
                        slot="icon"
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        aria-hidden="true"
                    >
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-4-4" />
                    </svg>
                    <svg
                        slot="go"
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.4"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M5 12h13M13 6l6 6-6 6" />
                    </svg>
                </bh-search-bar>
            </div>
        </header>
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
