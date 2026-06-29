import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    signal,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { LanguageService } from '@brickam/i18n-kit/browser';
import {
    AvatarComponent,
    BadgeComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    type SelectOption,
} from '@brickam/ui-kit';
import { SessionStore } from '../auth/session.store';
import { SeoService } from '../seo/seo.service';
import type { AccountType } from './models';
import { ProfileStore } from './profile.store';

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
 * Профиль покупателя (route /profile, гейт buyer). Реальные данные из
 * GET /users/me: шапка (аватар/имя/телефон), редактирование имени/типа
 * аккаунта/языка (PATCH /users/me), смена пароля (POST /users/me/password) и
 * быстрые переходы в разделы аккаунта. Без моков.
 */
@Component({
    selector: 'app-profile-page',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        RouterModule,
        MatIcon,
        AvatarComponent,
        BadgeComponent,
        ButtonComponent,
        InputComponent,
        SelectComponent,
    ],
    template: `
        <section class="flex flex-col gap-8">
            <header class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                    <bh-avatar [name]="name()" [size]="64" [ring]="true" />
                    <div>
                        <h1 class="m-0 text-text-primary" style="font: var(--type-hero)">
                            {{ name() || ph('title', 'My account') }}
                        </h1>
                        <p
                            class="m-0 flex items-center gap-2 text-text-secondary"
                            style="font: var(--type-product)"
                        >
                            <span>{{ phone() || '—' }}</span>
                            @if (verified()) {
                                <bh-badge tone="success">{{ ph('verified', 'Verified') }}</bh-badge>
                            }
                            <bh-badge tone="accent">{{ role() }}</bh-badge>
                        </p>
                    </div>
                </div>
                <bh-button variant="secondary" (clicked)="logout()">
                    {{ ph('logout', 'Logout') }}
                </bh-button>
            </header>

            <div class="grid gap-6 lg:grid-cols-2">
                <!-- Личные данные -->
                <article class="flex flex-col gap-4 rounded-md bg-surface-card p-6 shadow-glass">
                    <h2 class="m-0 text-text-primary" style="font: var(--type-section)">
                        {{ ph('personal', 'Personal info') }}
                    </h2>
                    <bh-input [label]="ph('name', 'Name')" [(value)]="name" [disabled]="saving()" />
                    <bh-select
                        [label]="ph('accountType', 'Account type')"
                        [options]="accountOptions()"
                        [(value)]="accountType"
                        [disabled]="saving()"
                    />
                    <bh-select
                        [label]="ph('language', 'Language')"
                        [options]="langOptions"
                        [(value)]="lang"
                        [disabled]="saving()"
                    />
                    @if (saved()) {
                        <p
                            class="m-0 text-success"
                            style="font: var(--type-caption)"
                            data-testid="profile-saved"
                        >
                            {{ ph('saved', 'Saved') }}
                        </p>
                    }
                    @if (error()) {
                        <p
                            class="m-0 text-danger"
                            style="font: var(--type-caption)"
                            data-testid="profile-error"
                        >
                            {{ ph('saveError', 'Could not save. Try again.') }}
                        </p>
                    }
                    <bh-button variant="primary" [disabled]="saving()" (clicked)="saveInfo()">
                        {{ saving() ? ph('saving', 'Saving…') : ph('save', 'Save') }}
                    </bh-button>
                </article>

                <!-- Смена пароля -->
                <article class="flex flex-col gap-4 rounded-md bg-surface-card p-6 shadow-glass">
                    <h2 class="m-0 text-text-primary" style="font: var(--type-section)">
                        {{ ph('password', 'Change password') }}
                    </h2>
                    <bh-input
                        [label]="ph('current', 'Current password')"
                        type="password"
                        [(value)]="currentPassword"
                        [disabled]="saving()"
                    />
                    <bh-input
                        [label]="ph('new', 'New password')"
                        type="password"
                        [(value)]="newPassword"
                        [error]="pwError()"
                        [disabled]="saving()"
                    />
                    @if (pwSaved()) {
                        <p
                            class="m-0 text-success"
                            style="font: var(--type-caption)"
                            data-testid="pw-saved"
                        >
                            {{ ph('pwSaved', 'Password updated') }}
                        </p>
                    }
                    <bh-button variant="secondary" [disabled]="saving()" (clicked)="changePassword()">
                        {{ ph('updatePassword', 'Update password') }}
                    </bh-button>
                </article>
            </div>

            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                @for (link of links; track link.route) {
                    <a
                        [routerLink]="link.route"
                        class="flex flex-col gap-4 rounded-md bg-surface-card p-6 shadow-glass transition-shadow duration-base ease-soft hover:shadow-glass-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                    >
                        <span
                            class="inline-flex h-12 w-12 items-center justify-center rounded-md bg-surface-chip text-accent"
                        >
                            <mat-icon>{{ link.icon }}</mat-icon>
                        </span>
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
    private readonly store = inject(ProfileStore);
    private readonly router = inject(Router);
    private readonly i18n = inject(LanguageService);
    private readonly seo = inject(SeoService);

    protected readonly links = LINKS;
    protected readonly langOptions: SelectOption[] = [
        { label: 'Հայերեն', value: 'hy' },
        { label: 'Русский', value: 'ru' },
        { label: 'English', value: 'en' },
    ];

    protected readonly role = computed(
        () => this.store.profile()?.role ?? this.session.profile()?.role ?? '—',
    );
    protected readonly phone = computed(() => this.store.profile()?.phone ?? '');
    protected readonly verified = computed(() => this.store.profile()?.phoneVerified ?? false);
    protected readonly saving = this.store.saving;
    protected readonly saved = this.store.saved;
    protected readonly error = this.store.error;

    // Редактируемые поля.
    protected readonly name = signal('');
    protected readonly accountType = signal<string | undefined>(undefined);
    protected readonly lang = signal<string | undefined>(undefined);
    protected readonly currentPassword = signal('');
    protected readonly newPassword = signal('');
    protected readonly pwError = signal<string | undefined>(undefined);
    protected readonly pwSaved = signal(false);

    protected readonly accountOptions = computed<SelectOption[]>(() => [
        { label: this.ph('individual', 'Individual'), value: 'individual' },
        { label: this.ph('company', 'Company'), value: 'company' },
    ]);

    constructor() {
        this.store.load();
        // Профиль пришёл → заполнить форму один раз.
        effect(() => {
            const p = this.store.profile();
            if (p && this.name() === '') {
                this.name.set(p.name);
                this.accountType.set(p.accountType ?? 'individual');
                this.lang.set(p.lang);
            }
        });
        effect(() => {
            this.i18n.lang();
            this.seo.set({
                title: this.ph('title', 'My account'),
                description: '',
                type: 'website',
            });
        });
    }

    protected saveInfo(): void {
        this.store.save({
            name: this.name().trim(),
            accountType: this.accountType() as AccountType,
            lang: this.lang() as 'hy' | 'ru' | 'en',
        });
    }

    protected changePassword(): void {
        this.pwSaved.set(false);
        if (this.newPassword().trim().length < 8) {
            this.pwError.set(this.ph('pwTooShort', 'Min 8 characters'));
            return;
        }
        this.pwError.set(undefined);
        this.store.changePassword(
            { currentPassword: this.currentPassword(), newPassword: this.newPassword() },
            (ok) => {
                if (ok) {
                    this.currentPassword.set('');
                    this.newPassword.set('');
                    this.pwSaved.set(true);
                } else {
                    this.pwError.set(this.ph('pwError', 'Could not change password'));
                }
            },
        );
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
