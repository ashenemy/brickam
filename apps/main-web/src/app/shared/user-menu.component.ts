import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { Router, RouterModule } from '@angular/router';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { SessionStore } from '../auth/session.store';

/**
 * Иконка пользователя в шапке: если авторизован — иконка профиля + меню
 * (профиль / история заказов / выход); иначе — иконка входа со ссылкой на /login.
 * Inline-шаблон (интерполяции вне внешнего app.html). Подписи локализованы.
 */
@Component({
    selector: 'app-user-menu',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterModule, MatIconButton, MatIcon, MatMenu, MatMenuItem, MatMenuTrigger],
    template: `
        @if (session.isAuthenticated()) {
            <button
                matIconButton
                type="button"
                class="bh-icon-bordered"
                [matMenuTriggerFor]="userMenu"
                aria-label="Account"
                data-testid="nav-user"
            >
                <mat-icon style="width: 22px; height: 22px; font-size: 22px; line-height: 22px">person</mat-icon>
            </button>
            <mat-menu #userMenu="matMenu">
                <a mat-menu-item href="/profile" routerLink="/profile">{{
                    tr('user.profile', 'Profile')
                }}</a>
                <a mat-menu-item href="/orders" routerLink="/orders" data-testid="nav-orders">{{
                    tr('user.orders', 'Order history')
                }}</a>
                <button mat-menu-item type="button" (click)="logout()" data-testid="nav-logout">
                    {{ tr('user.logout', 'Log out') }}
                </button>
            </mat-menu>
        } @else {
            <a
                matIconButton
                href="/login"
                routerLink="/login"
                class="bh-icon-bordered"
                aria-label="Login"
                data-testid="nav-login"
            >
                <mat-icon style="width: 22px; height: 22px; font-size: 22px; line-height: 22px">login</mat-icon>
            </a>
        }
    `,
})
export class UserMenuComponent {
    protected readonly session = inject(SessionStore);
    private readonly router = inject(Router);
    private readonly i18n = inject(LanguageService);

    protected tr(key: string, fallback: string): string {
        const value = this.i18n.t(key);
        return value === key ? fallback : value;
    }

    protected logout(): void {
        this.session.logout();
        void this.router.navigate(['/login']);
    }
}
