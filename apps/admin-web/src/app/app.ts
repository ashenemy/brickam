import { isPlatformBrowser } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    type OnInit,
    PLATFORM_ID,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LangSwitcherComponent, LanguageService } from '@brickam/i18n-kit/browser';
import { ButtonComponent, FooterComponent, NavbarComponent } from '@brickam/ui-kit';
import { SessionStore } from './auth/session.store';

/** Пункт навигации админки: подпись (i18n) и маршрут. */
type AdminNavItem = { labelKey: string; path: string };

const NAV: readonly AdminNavItem[] = [
    { labelKey: 'admin.nav.categories', path: 'categories' },
    { labelKey: 'admin.nav.moderation', path: 'moderation' },
    { labelKey: 'admin.nav.settings', path: 'settings' },
    { labelKey: 'admin.nav.disputes', path: 'disputes' },
    { labelKey: 'admin.nav.analytics', path: 'analytics' },
    { labelKey: 'admin.nav.templates', path: 'templates' },
    { labelKey: 'admin.nav.loyalty', path: 'loyalty' },
    { labelKey: 'admin.nav.audit', path: 'audit' },
];

@Component({
    selector: 'app-root',
    imports: [
        RouterModule,
        NavbarComponent,
        FooterComponent,
        LangSwitcherComponent,
        ButtonComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <header class="sticky top-0 z-20">
            <bh-navbar [navItems]="adminNav()" (nav)="onNav($event)" />
            <div class="flex justify-end items-center gap-3 px-6 py-2 bg-bg-app">
                <bh-lang-switcher />
                @if (isAuthenticated()) {
                    <bh-button variant="ghost" size="sm" (clicked)="onLogout()">
                        {{ logoutLabel() }}
                    </bh-button>
                } @else {
                    <bh-button variant="ghost" size="sm" (clicked)="onSignIn()">
                        {{ signInLabel() }}
                    </bh-button>
                }
            </div>
        </header>

        <main class="mx-auto w-full max-w-content px-6 py-10">
            <router-outlet />
        </main>

        <bh-footer />
    `,
})
export class App implements OnInit {
    private readonly router = inject(Router);
    private readonly i18n = inject(LanguageService);
    private readonly session = inject(SessionStore);
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    /** Признак аутентификации — управляет навигацией/кнопками шелла. */
    protected readonly isAuthenticated = this.session.isAuthenticated;

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
        // Подтянуть роль из GET /auth/me, если сессия жива (после перезагрузки).
        if (this.isBrowser && this.session.isAuthenticated()) {
            this.session.loadProfile();
        }
    }

    /** Подписи для navbar: только когда вошли, иначе пусто (разделы скрыты). */
    protected readonly adminNav = computed(() =>
        this.isAuthenticated() ? NAV.map((item) => this.i18n.t(item.labelKey)) : [],
    );

    /** Подпись кнопки «Выйти». */
    protected readonly logoutLabel = computed(() => this.i18n.t('auth.logout'));

    /** Подпись ссылки «Войти». */
    protected readonly signInLabel = computed(() => this.i18n.t('auth.signIn'));

    /** Переход по выбранной подписи navbar. */
    protected onNav(label: string): void {
        const labels = this.adminNav();
        const index = labels.indexOf(label);
        if (index >= 0) {
            void this.router.navigate([NAV[index].path]);
        }
    }

    /** Переход на экран входа. */
    protected onSignIn(): void {
        void this.router.navigate(['/login']);
    }

    /** Выход: очистить сессию и уйти на экран входа. */
    protected onLogout(): void {
        this.session.logout();
        void this.router.navigate(['/login']);
    }
}
