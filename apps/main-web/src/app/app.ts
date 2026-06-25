import { isPlatformBrowser } from '@angular/common';
import { Component, inject, type OnInit, PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LangSwitcherComponent } from '@brickam/i18n-kit/browser';
import { FooterComponent, NavbarComponent } from '@brickam/ui-kit';
import { ChatStore } from './chat/chat.store';
import { ChatBadgeComponent } from './chat/chat-badge.component';
import { CurrencyStore } from './currency/currency.store';
import { CurrencySwitcherComponent } from './currency/currency-switcher.component';
import { LoyaltyStore } from './loyalty/loyalty.store';
import { LoyaltyBadgeComponent } from './loyalty/loyalty-badge.component';
import { WishlistStore } from './wishlist/wishlist.store';
import { WishlistBadgeComponent } from './wishlist/wishlist-badge.component';

@Component({
    imports: [
        RouterModule,
        NavbarComponent,
        FooterComponent,
        LangSwitcherComponent,
        WishlistBadgeComponent,
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
    private readonly chatStore = inject(ChatStore);
    private readonly currencyStore = inject(CurrencyStore);
    private readonly loyaltyStore = inject(LoyaltyStore);
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    ngOnInit(): void {
        // Подтягиваем счётчики вишлиста/чата и валюты при старте — только в браузере.
        // load()/loadChats() глушат 401/ошибку через catchError и не падают.
        if (this.isBrowser) {
            this.wishlistStore.load();
            this.chatStore.loadChats();
            this.currencyStore.load();
            this.loyaltyStore.load();
        }
    }

    protected onNav(_item: string): void {
        // навигация по разделам — подключится с реальными маршрутами каталога (Stage 4+)
    }
}
