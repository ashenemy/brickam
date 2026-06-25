import { ChangeDetectionStrategy, Component, inject, type OnInit, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { ButtonComponent, InputComponent } from '@brickam/ui-kit';
import { AuthApiService } from './auth-api.service';
import { SessionStore } from './session.store';

/**
 * Страница входа (route /login). Форма: телефон + пароль → POST /auth/login →
 * токены кладутся в сессию → редирект на «/». Standalone + OnPush + signals,
 * SSR-безопасно (запрос только по сабмиту). Локализация — ключи auth.*.
 */
@Component({
    selector: 'app-login',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [InputComponent, ButtonComponent, RouterLink],
    template: `
        <section class="mx-auto flex w-full max-w-sm flex-col gap-6">
            <header>
                <h1 class="text-text-primary" style="font: var(--type-hero)">
                    {{ t('loginTitle') }}
                </h1>
            </header>

            <form class="flex flex-col gap-4" (submit)="submit($event)">
                <bh-input
                    [label]="t('phone')"
                    type="tel"
                    [(value)]="phone"
                    [disabled]="loading()"
                />
                <bh-input
                    [label]="t('password')"
                    type="password"
                    [(value)]="password"
                    [disabled]="loading()"
                />

                @if (error()) {
                    <p class="text-danger" style="font: var(--type-caption)" data-testid="login-error">
                        {{ t('error') }}
                    </p>
                }

                <bh-button
                    type="submit"
                    variant="primary"
                    [block]="true"
                    [disabled]="loading() || !canSubmit()"
                    data-testid="login-submit"
                >
                    {{ t('signIn') }}
                </bh-button>
            </form>

            <p class="text-text-secondary" style="font: var(--type-product)">
                {{ t('noAccount') }}
                <a
                    routerLink="/register"
                    class="text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                    data-testid="login-to-register"
                >
                    {{ t('signUp') }}
                </a>
            </p>
        </section>
    `,
})
export class LoginPageComponent implements OnInit {
    private readonly api = inject(AuthApiService);
    private readonly session = inject(SessionStore);
    private readonly router = inject(Router);
    private readonly i18n = inject(LanguageService);
    private readonly title = inject(Title);

    protected readonly phone = signal('');
    protected readonly password = signal('');
    protected readonly loading = signal(false);
    protected readonly error = signal(false);

    ngOnInit(): void {
        this.title.setTitle(this.t('loginTitle'));
    }

    protected canSubmit(): boolean {
        return this.phone().trim().length > 0 && this.password().length > 0;
    }

    protected submit(event: Event): void {
        event.preventDefault();
        if (this.loading() || !this.canSubmit()) {
            return;
        }
        this.loading.set(true);
        this.error.set(false);
        this.api.login(this.phone().trim(), this.password()).subscribe({
            next: (res) => {
                this.session.applyTokens(res.tokens);
                this.loading.set(false);
                this.router.navigate(['/']);
            },
            error: () => {
                this.error.set(true);
                this.loading.set(false);
            },
        });
    }

    protected t(key: string): string {
        return this.i18n.t(`auth.${key}`);
    }
}
