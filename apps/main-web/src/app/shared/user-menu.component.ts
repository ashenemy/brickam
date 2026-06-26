import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { Router, RouterModule } from '@angular/router';
import { SessionStore } from '../auth/session.store';

/**
 * Иконка пользователя в шапке: если авторизован — меню (профиль/заказы/выход),
 * иначе ссылка на /login. Inline-шаблон (интерполяции вне внешнего app.html).
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
                [matMenuTriggerFor]="userMenu"
                aria-label="Account"
                data-testid="nav-user"
            >
                <mat-icon>person</mat-icon>
            </button>
            <mat-menu #userMenu="matMenu">
                <a mat-menu-item href="/profile" routerLink="/profile">My profile</a>
                <a mat-menu-item href="/orders" routerLink="/orders" data-testid="nav-orders">
                    My orders
                </a>
                <button mat-menu-item type="button" (click)="logout()" data-testid="nav-logout">
                    Logout
                </button>
            </mat-menu>
        } @else {
            <a matIconButton href="/login" routerLink="/login" aria-label="Login" data-testid="nav-login">
                <mat-icon>person</mat-icon>
            </a>
        }
    `,
})
export class UserMenuComponent {
    protected readonly session = inject(SessionStore);
    private readonly router = inject(Router);

    protected logout(): void {
        this.session.logout();
        void this.router.navigate(['/login']);
    }
}
