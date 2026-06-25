import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { ButtonComponent, InputComponent } from '@brickam/ui-kit';
import { AuthApiService } from './auth-api.service';
import { SessionStore } from './session.store';

/**
 * Экран входа в админку. Только логин (телефон + пароль) — регистрации нет.
 * После успеха кладём токены в сессию и уходим на главную.
 */
@Component({
    selector: 'app-login',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [InputComponent, ButtonComponent],
    template: `
        <section class="mx-auto flex max-w-sm flex-col gap-6 py-16">
            <h1 class="text-text-primary" style="font: var(--type-display)">
                {{ t('auth.loginTitle') }}
            </h1>
            <form class="flex flex-col gap-4" (submit)="onSubmit($event)">
                <bh-input
                    [label]="t('auth.phone')"
                    type="tel"
                    [value]="phone()"
                    (changed)="phone.set($event)"
                />
                <bh-input
                    [label]="t('auth.password')"
                    type="password"
                    [value]="password()"
                    (changed)="password.set($event)"
                />
                @if (error()) {
                    <p class="text-danger" style="font: var(--type-caption)" role="alert">
                        {{ t('auth.error') }}
                    </p>
                }
                <bh-button type="submit" [block]="true" [disabled]="loading()">
                    {{ t('auth.signIn') }}
                </bh-button>
            </form>
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
    protected readonly error = signal(false);

    protected t(key: string): string {
        return this.i18n.t(key);
    }

    protected onSubmit(event: Event): void {
        event.preventDefault();
        if (this.loading()) {
            return;
        }
        this.loading.set(true);
        this.error.set(false);
        this.api.login(this.phone(), this.password()).subscribe({
            next: (data) => {
                this.session.applyTokens(data.tokens);
                this.loading.set(false);
                void this.router.navigate(['/']);
            },
            error: () => {
                this.loading.set(false);
                this.error.set(true);
            },
        });
    }
}
