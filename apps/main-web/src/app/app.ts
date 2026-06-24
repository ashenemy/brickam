import { isPlatformBrowser } from '@angular/common';
import { Component, inject, type OnInit, PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LangSwitcherComponent } from '@brickam/i18n-kit/browser';
import { FooterComponent, NavbarComponent } from '@brickam/ui-kit';
import { WishlistStore } from './wishlist/wishlist.store';
import { WishlistBadgeComponent } from './wishlist/wishlist-badge.component';

@Component({
    imports: [
        RouterModule,
        NavbarComponent,
        FooterComponent,
        LangSwitcherComponent,
        WishlistBadgeComponent,
    ],
    selector: 'app-root',
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App implements OnInit {
    protected readonly wishlistStore = inject(WishlistStore);
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    ngOnInit(): void {
        // Подтягиваем счётчик вишлиста при старте — только в браузере.
        // load() сам глушит 401/ошибку через catchError и не падает.
        if (this.isBrowser) {
            this.wishlistStore.load();
        }
    }

    protected onNav(_item: string): void {
        // навигация по разделам — подключится с реальными маршрутами каталога (Stage 4+)
    }
}
