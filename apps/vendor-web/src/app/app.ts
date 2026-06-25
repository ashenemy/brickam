import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LangSwitcherComponent } from '@brickam/i18n-kit/browser';
import { FooterComponent } from '@brickam/ui-kit';
import { SessionStore } from './auth/session.store';

/**
 * Шелл vendor-web: верхняя навигация по разделам кабинета продавца
 * (RouterLink, активная подсветка), переключатель языка, контентный outlet.
 * Подписи навигации — статические строки (biome HTML-парсер без интерполяции);
 * локализация разделов — через ключи vendor.nav.* внутри самих страниц.
 * Справа — вход/выход в зависимости от наличия сессии.
 */
@Component({
    selector: 'app-root',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterModule, FooterComponent, LangSwitcherComponent],
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {
    private readonly session = inject(SessionStore);
    private readonly router = inject(Router);

    /** Признак активной сессии продавца. */
    protected readonly isAuthenticated = this.session.isAuthenticated;

    /** Выйти из аккаунта и вернуться на страницу входа. */
    protected logout(): void {
        this.session.logout();
        this.router.navigate(['/login']);
    }
}
