import { ChangeDetectionStrategy, Component, inject, type OnInit, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { ButtonComponent, InputComponent } from '@brickam/ui-kit';
import { PhoneInputComponent } from '../shared/phone-input.component';
import { AuthApiService } from './auth-api.service';
import { SessionStore } from './session.store';

/** Шаг мастера регистрации. */
type Step = 'form' | 'otp';

/**
 * Страница регистрации (route /register). Двухшаговый мастер в одном компоненте:
 * шаг 1 — телефон+пароль+имя → POST /auth/register (OTP отправлен);
 * шаг 2 — код из SMS → POST /auth/verify-otp → токены в сессию → редирект на «/».
 * Standalone + OnPush + signals, SSR-безопасно. Локализация — ключи auth.*.
 */
@Component({
    selector: 'app-register',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [InputComponent, PhoneInputComponent, ButtonComponent, RouterLink],
    template: `
        <section class="mx-auto flex w-full max-w-sm flex-col gap-6">
            <header>
                <h1 class="text-text-primary" style="font: var(--type-hero)">
                    {{ step() === 'form' ? t('registerTitle') : t('verifyTitle') }}
                </h1>
            </header>

            @if (step() === 'form') {
                <form class="flex flex-col gap-4" (submit)="submitForm($event)">
                    <bh-input
                        [label]="t('name')"
                        [(value)]="name"
                        [disabled]="loading()"
                    />
                    <app-phone-input [label]="t('phone')" [(value)]="phone" [disabled]="loading()" />
                    <bh-input
                        [label]="t('password')"
                        type="password"
                        [(value)]="password"
                        [disabled]="loading()"
                    />

                    @if (error()) {
                        <p
                            class="text-danger"
                            style="font: var(--type-caption)"
                            data-testid="register-error"
                        >
                            {{ t('error') }}
                        </p>
                    }

                    <bh-button
                        type="submit"
                        variant="primary"
                        [block]="true"
                        [disabled]="loading() || !canSubmitForm()"
                        data-testid="register-submit"
                    >
                        {{ t('submit') }}
                    </bh-button>
                </form>

                <p class="text-text-secondary" style="font: var(--type-product)">
                    {{ t('haveAccount') }}
                    <a
                        routerLink="/login"
                        class="text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                        data-testid="register-to-login"
                    >
                        {{ t('signIn') }}
                    </a>
                </p>
            } @else {
                <p class="text-text-secondary" style="font: var(--type-product)" data-testid="otp-sent">
                    {{ t('otpSent') }}
                </p>

                <form class="flex flex-col gap-4" (submit)="submitOtp($event)">
                    <bh-input
                        [label]="t('code')"
                        type="text"
                        [(value)]="code"
                        [disabled]="loading()"
                    />

                    @if (error()) {
                        <p
                            class="text-danger"
                            style="font: var(--type-caption)"
                            data-testid="verify-error"
                        >
                            {{ t('error') }}
                        </p>
                    }

                    <bh-button
                        type="submit"
                        variant="primary"
                        [block]="true"
                        [disabled]="loading() || code().trim().length === 0"
                        data-testid="verify-submit"
                    >
                        {{ t('submit') }}
                    </bh-button>
                </form>
            }
        </section>
    `,
})
export class RegisterPageComponent implements OnInit {
    private readonly api = inject(AuthApiService);
    private readonly session = inject(SessionStore);
    private readonly router = inject(Router);
    private readonly i18n = inject(LanguageService);
    private readonly title = inject(Title);

    protected readonly step = signal<Step>('form');
    protected readonly name = signal('');
    protected readonly phone = signal('');
    protected readonly password = signal('');
    protected readonly code = signal('');
    protected readonly loading = signal(false);
    protected readonly error = signal(false);

    ngOnInit(): void {
        this.title.setTitle(this.t('registerTitle'));
    }

    protected canSubmitForm(): boolean {
        return (
            this.name().trim().length > 0 &&
            this.phone().trim().length > 0 &&
            this.password().length > 0
        );
    }

    protected submitForm(event: Event): void {
        event.preventDefault();
        if (this.loading() || !this.canSubmitForm()) {
            return;
        }
        this.loading.set(true);
        this.error.set(false);
        this.api.register(this.phone().trim(), this.password(), this.name().trim()).subscribe({
            next: () => {
                this.loading.set(false);
                this.step.set('otp');
            },
            error: () => {
                this.error.set(true);
                this.loading.set(false);
            },
        });
    }

    protected submitOtp(event: Event): void {
        event.preventDefault();
        if (this.loading() || this.code().trim().length === 0) {
            return;
        }
        this.loading.set(true);
        this.error.set(false);
        this.api.verifyOtp(this.phone().trim(), this.code().trim()).subscribe({
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
