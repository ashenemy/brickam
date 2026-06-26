import { isPlatformBrowser } from '@angular/common';
import { Component, effect, inject, type OnInit, PLATFORM_ID } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LangSwitcherComponent, LanguageService } from '@brickam/i18n-kit/browser';
import { NavbarComponent, FooterComponent as UiFooterComponent } from '@brickam/ui-kit';
import { SessionStore } from './auth/session.store';
import { CartStore } from './cart/cart.store';
import { CartBadgeComponent } from './cart/cart-badge.component';
import { ChatStore } from './chat/chat.store';
import { ChatBadgeComponent } from './chat/chat-badge.component';
import { CurrencyStore } from './currency/currency.store';
import { CurrencySwitcherComponent } from './currency/currency-switcher.component';
import { LoyaltyStore } from './loyalty/loyalty.store';
import { LoyaltyBadgeComponent } from './loyalty/loyalty-badge.component';
import { FooterComponent } from './shared/footer.component';
import { WishlistStore } from './wishlist/wishlist.store';
import { WishlistBadgeComponent } from './wishlist/wishlist-badge.component';

@Component({
    imports: [
        RouterModule,
        NavbarComponent,
        UiFooterComponent,
        FooterComponent,
        LangSwitcherComponent,
        WishlistBadgeComponent,
        CartBadgeComponent,
        ChatBadgeComponent,
        CurrencySwitcherComponent,
        LoyaltyBadgeComponent,
    ],
    selector: 'app-root',
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App implements OnInit {
    protected readonly wishlistStore = inject(WishlistStore);
    protected readonly session = inject(SessionStore);
    private readonly cartStore = inject(CartStore);
    private readonly chatStore = inject(ChatStore);
    private readonly currencyStore = inject(CurrencyStore);
    private readonly loyaltyStore = inject(LoyaltyStore);
    private readonly router = inject(Router);
    private readonly i18n = inject(LanguageService);
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    constructor() {
        // Синхронизируем <html lang> с текущим языком i18n (hy/ru/en).
        effect(() => {
            const lang = this.i18n.lang();
            if (this.isBrowser && typeof document !== 'undefined') {
                document.documentElement.lang = lang;
            }
        });
    }

    ngOnInit(): void {
        // Подтягиваем счётчики вишлиста/чата и валюты при старте — только в браузере.
        // load()/loadChats() глушат 401/ошибку через catchError и не падают.
        if (this.isBrowser) {
            // Подтянуть роль из GET /auth/me, если сессия жива (после перезагрузки).
            if (this.session.isAuthenticated()) {
                this.session.loadProfile();
            }
            this.wishlistStore.load();
            this.cartStore.load();
            this.chatStore.loadChats();
            this.currencyStore.load();
            this.loyaltyStore.load();
        }
    }

    protected onNav(_item: string): void {
        // навигация по разделам — подключится с реальными маршрутами каталога (Stage 4+)
    }

    protected logout(): void {
        this.session.logout();
        this.router.navigate(['/login']);
    }
}
