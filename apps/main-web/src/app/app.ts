import { isPlatformBrowser } from '@angular/common';
import {
    Component,
    computed,
    effect,
    inject,
    type OnInit,
    PLATFORM_ID,
    signal,
} from '@angular/core';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { Router, RouterModule } from '@angular/router';
import { LanguageService } from '@brickam/i18n-kit/browser';
import {
    type CategoryGroup,
    NavbarComponent,
    type SearchMode,
    FooterComponent as UiFooterComponent,
} from '@brickam/ui-kit';
import { SessionStore } from './auth/session.store';
import { CartStore } from './cart/cart.store';
import { CartBadgeComponent } from './cart/cart-badge.component';
import { CatalogApiService } from './catalog/catalog-api.service';
import type { Category, SocialLink } from './catalog/models';
import { ChatStore } from './chat/chat.store';
import { CurrencyStore } from './currency/currency.store';
import { LoyaltyStore } from './loyalty/loyalty.store';
import { LangCurrencySwitcherComponent } from './shared/lang-currency-switcher.component';
import { UserMenuComponent } from './shared/user-menu.component';
import { WishlistStore } from './wishlist/wishlist.store';
import { WishlistBadgeComponent } from './wishlist/wishlist-badge.component';

/** Пункты основной навигации (i18n-ключ + фолбэк → маршрут CMS-страницы). */
const NAV: { key: string; fallback: string; route: string }[] = [
    { key: 'nav.about', fallback: 'About us', route: '/p/about' },
    { key: 'nav.partner', fallback: 'Become a partner', route: '/p/partner' },
    { key: 'nav.delivery', fallback: 'Delivery', route: '/p/delivery' },
    { key: 'nav.payments', fallback: 'Payments', route: '/p/payments' },
    { key: 'nav.refunds', fallback: 'Refunds', route: '/p/refunds' },
];

/** Слаги CMS-страниц для футера (label → /p/slug). */
const LEGAL: Record<string, string> = {
    About: 'about',
    'Terms of use': 'terms',
    'Privacy policy': 'privacy',
};

@Component({
    imports: [
        RouterModule,
        MatSidenavContainer,
        MatSidenav,
        MatSidenavContent,
        NavbarComponent,
        UiFooterComponent,
        WishlistBadgeComponent,
        CartBadgeComponent,
        LangCurrencySwitcherComponent,
        UserMenuComponent,
    ],
    selector: 'app-root',
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App implements OnInit {
    private readonly session = inject(SessionStore);
    private readonly wishlistStore = inject(WishlistStore);
    private readonly cartStore = inject(CartStore);
    private readonly chatStore = inject(ChatStore);
    private readonly currencyStore = inject(CurrencyStore);
    private readonly loyaltyStore = inject(LoyaltyStore);
    private readonly catalogApi = inject(CatalogApiService);
    private readonly router = inject(Router);
    private readonly i18n = inject(LanguageService);
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    /** Локализованные подписи навигации (реагируют на смену языка). */
    protected readonly navItems = computed(() => NAV.map((n) => this.tr(n.key, n.fallback)));

    /** Локализованные плейсхолдеры поиска (обычный / AI). */
    protected readonly searchPlaceholder = computed(() =>
        this.tr('search.placeholder', 'Search materials, tools…'),
    );
    protected readonly aiPlaceholder = computed(() =>
        this.tr(
            'search.aiPlaceholder',
            "Describe in your own words what you want to do — we'll find everything you need",
        ),
    );

    /** true при проскролле контента — шапка прижата к top:0, строка поиска свёрнута. */
    protected readonly scrolled = signal(false);

    protected onScroll(event: Event): void {
        this.scrolled.set((event.target as HTMLElement).scrollTop > 8);
    }

    private readonly categories = signal<Category[]>([]);
    protected readonly socials = signal<SocialLink[]>([]);

    /** Группы мега-меню: корни + подкатегории, локализованные текущим языком. */
    protected readonly categoryGroups = computed<CategoryGroup[]>(() => {
        const lang = this.i18n.lang();
        const all = this.categories();
        const roots = all.filter((c) => !c.parentId).sort((a, b) => a.order - b.order);
        return roots.map((root) => ({
            slug: root.slug,
            label: root.name[lang],
            ...(root.icon ? { icon: root.icon } : {}),
            items: all
                .filter((c) => c.parentId === root.id)
                .sort((a, b) => a.order - b.order)
                .map((c) => ({ slug: c.slug, label: c.name[lang] })),
        }));
    });

    protected readonly footerCopyright = computed(() => {
        this.i18n.lang();
        return `© ${new Date().getFullYear()} Brickam. ${this.tr('footer.rights', 'All rights reserved.')}`;
    });
    protected readonly footerLegal = Object.keys(LEGAL);

    constructor() {
        // <html lang> синхронизируется с выбранным языком.
        effect(() => {
            const lang = this.i18n.lang();
            if (this.isBrowser && typeof document !== 'undefined') {
                document.documentElement.lang = lang;
            }
        });
    }

    ngOnInit(): void {
        if (!this.isBrowser) {
            return;
        }
        if (this.session.isAuthenticated()) {
            this.session.loadProfile();
        }
        this.wishlistStore.load();
        this.cartStore.load();
        this.chatStore.loadChats();
        this.currencyStore.load();
        this.loyaltyStore.load();
        this.catalogApi.getCategories().subscribe({
            next: (cats) => this.categories.set(cats),
            error: () => this.categories.set([]),
        });
        this.catalogApi.getSocialLinks().subscribe({
            next: (links) => this.socials.set(links),
            error: () => this.socials.set([]),
        });
    }

    protected onNav(label: string): void {
        const idx = this.navItems().indexOf(label);
        const route = NAV[idx]?.route ?? '/';
        void this.router.navigate([route]);
    }

    protected onSearch(event: { query: string; mode: SearchMode }): void {
        const query = event.query.trim();
        const path = event.mode === 'ai' ? '/ai' : '/catalog';
        void this.router.navigate([path], query ? { queryParams: { q: query } } : {});
    }

    protected onCategory(slug: string): void {
        void this.router.navigate(['/catalog'], { queryParams: { category: slug } });
    }

    protected onLegal(label: string): void {
        const slug = LEGAL[label];
        if (slug) void this.router.navigate(['/p', slug]);
    }

    private tr(key: string, fallback: string): string {
        const value = this.i18n.t(key);
        return value === key ? fallback : value;
    }
}
