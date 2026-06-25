import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { ButtonComponent, InputComponent } from '@brickam/ui-kit';
import { AuthApiService } from './auth-api.service';
import { SessionStore } from './session.store';

/**
 * Страница входа продавца (/login). Телефон + пароль → POST /auth/login,
 * полученные токены сохраняются в сессии, далее переход в кабинет (/).
 * Есть ссылка на регистрацию. standalone + OnPush + signals.
 */
@Component({
    selector: 'app-login',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonComponent, InputComponent, RouterLink],
    template: `
        <section class="mx-auto flex w-full max-w-sm flex-col gap-6">
            <h1 class="text-text-primary" style="font: var(--type-display)">
                {{ t('auth.loginTitle') }}
            </h1>

            @if (error()) {
                <p class="text-danger" role="alert">{{ error() }}</p>
            }

            <div class="flex flex-col gap-4">
                <bh-input
                    type="tel"
                    [label]="t('auth.phone')"
                    [value]="phone()"
                    (changed)="phone.set($event)"
                />
                <bh-input
                    type="password"
                    [label]="t('auth.password')"
                    [value]="password()"
                    (changed)="password.set($event)"
                />
                <bh-button
                    variant="primary"
                    [block]="true"
                    [disabled]="loading() || !canSubmit()"
                    (clicked)="submit()"
                >
                    {{ t('auth.submit') }}
                </bh-button>
            </div>

            <p class="text-text-secondary" style="font: var(--type-product)">
                {{ t('auth.noAccount') }}
                <a routerLink="/register" class="text-accent">{{ t('auth.signUp') }}</a>
            </p>
        </section>
    `,
})
export class LoginPageComponent {
    private readonly api = inject(AuthApiService);
    private readonly session = inject(SessionStore);
    private readonly router = inject(Router);
    private readonly i18n = inject(LanguageService);

    protected readonly phone = signal('');
    protected readonly password = signal('');
    protected readonly loading = signal(false);
    protected readonly error = signal<string | null>(null);

    protected readonly canSubmit = computed(
        () => this.phone().trim().length > 0 && this.password().length > 0,
    );

    protected t(key: string): string {
        return this.i18n.t(key);
    }

    protected submit(): void {
        if (!this.canSubmit() || this.loading()) {
            return;
        }
        this.loading.set(true);
        this.error.set(null);
        this.api.login(this.phone().trim(), this.password()).subscribe({
            next: ({ tokens }) => {
                this.session.applyTokens(tokens);
                this.loading.set(false);
                this.router.navigate(['/']);
            },
            error: () => {
                this.error.set(this.t('auth.error'));
                this.loading.set(false);
            },
        });
    }
}
