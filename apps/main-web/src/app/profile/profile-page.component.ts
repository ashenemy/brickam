import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { ButtonComponent } from '@brickam/ui-kit';
import { SessionStore } from '../auth/session.store';
import { SeoService } from '../seo/seo.service';

interface ProfileLink {
    route: string;
    icon: string;
    key: string;
    fallback: string;
}

const LINKS: ProfileLink[] = [
    { route: '/orders', icon: 'receipt_long', key: 'orders', fallback: 'My orders' },
    { route: '/wishlist', icon: 'favorite', key: 'wishlist', fallback: 'Wishlist' },
    { route: '/loyalty', icon: 'loyalty', key: 'loyalty', fallback: 'Loyalty' },
    { route: '/cart', icon: 'shopping_cart', key: 'cart', fallback: 'Cart' },
];

/**
 * Профиль покупателя (route /profile, гейт buyer). Показывает реальные данные
 * сессии (роль из GET /auth/me) и переходы в разделы аккаунта. Без моков.
 */
@Component({
    selector: 'app-profile-page',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterModule, MatIcon, ButtonComponent],
    template: `
        <section class="flex flex-col gap-8">
            <header class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                    <span
                        class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-surface-chip text-accent"
                    >
                        <mat-icon style="font-size: 32px; width: 32px; height: 32px">person</mat-icon>
                    </span>
                    <div>
                        <h1 class="m-0 text-text-primary" style="font: var(--type-h1)">
                            {{ ph('title', 'My account') }}
                        </h1>
                        <p class="m-0 text-text-secondary" style="font: var(--type-product)">
                            {{ ph('role', 'Role') }}: {{ role() }}
                        </p>
                    </div>
                </div>
                <bh-button variant="secondary" (clicked)="logout()">
                    {{ ph('logout', 'Logout') }}
                </bh-button>
            </header>

            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                @for (link of links; track link.route) {
                    <a
                        [routerLink]="link.route"
                        class="brick-glass flex flex-col gap-3 p-6 transition-shadow duration-base ease-soft hover:shadow-glass-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                    >
                        <mat-icon class="text-accent">{{ link.icon }}</mat-icon>
                        <span class="text-text-primary" style="font: var(--type-label)">
                            {{ ph(link.key, link.fallback) }}
                        </span>
                    </a>
                }
            </div>
        </section>
    `,
})
export class ProfilePageComponent {
    private readonly session = inject(SessionStore);
    private readonly router = inject(Router);
    private readonly i18n = inject(LanguageService);
    private readonly seo = inject(SeoService);

    protected readonly links = LINKS;
    protected readonly role = computed(() => this.session.profile()?.role ?? '—');

    constructor() {
        effect(() => {
            this.i18n.lang();
            this.seo.set({
                title: this.ph('title', 'My account'),
                description: '',
                type: 'website',
            });
        });
    }

    protected logout(): void {
        this.session.logout();
        void this.router.navigate(['/login']);
    }

    protected ph(key: string, fallback: string): string {
        const full = `profile.${key}`;
        const value = this.i18n.t(full);
        return value === full ? fallback : value;
    }
}
