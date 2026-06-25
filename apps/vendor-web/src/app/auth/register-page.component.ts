import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { ButtonComponent, InputComponent } from '@brickam/ui-kit';
import { AuthApiService } from './auth-api.service';
import { SessionStore } from './session.store';

/**
 * Регистрация владельца вендора (/register), два шага:
 *  1) телефон + пароль + имя → POST /auth/register (role vendor_owner) → otpSent;
 *  2) код из SMS → POST /auth/verify-otp → токены в сессию → переход в кабинет (/).
 * Есть ссылка на вход. standalone + OnPush + signals.
 */
@Component({
    selector: 'app-register',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonComponent, InputComponent, RouterLink],
    template: `
        <section class="mx-auto flex w-full max-w-sm flex-col gap-6">
            <h1 class="text-text-primary" style="font: var(--type-display)">
                {{ step() === 'verify' ? t('auth.verifyTitle') : t('auth.registerTitle') }}
            </h1>

            @if (error()) {
                <p class="text-danger" role="alert">{{ error() }}</p>
            }

            @if (step() === 'form') {
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
                    <bh-input
                        [label]="t('auth.name')"
                        [value]="name()"
                        (changed)="name.set($event)"
                    />
                    <bh-button
                        variant="primary"
                        [block]="true"
                        [disabled]="loading() || !canRegister()"
                        (clicked)="register()"
                    >
                        {{ t('auth.submit') }}
                    </bh-button>
                </div>

                <p class="text-text-secondary" style="font: var(--type-product)">
                    {{ t('auth.haveAccount') }}
                    <a routerLink="/login" class="text-accent">{{ t('auth.signIn') }}</a>
                </p>
            } @else {
                <div class="flex flex-col gap-4">
                    <bh-input
                        [label]="t('auth.code')"
                        [hint]="t('auth.otpSent')"
                        [value]="code()"
                        (changed)="code.set($event)"
                    />
                    <bh-button
                        variant="primary"
                        [block]="true"
                        [disabled]="loading() || !canVerify()"
                        (clicked)="verify()"
                    >
                        {{ t('auth.submit') }}
                    </bh-button>
                </div>
            }
        </section>
    `,
})
export class RegisterPageComponent {
    private readonly api = inject(AuthApiService);
    private readonly session = inject(SessionStore);
    private readonly router = inject(Router);
    private readonly i18n = inject(LanguageService);

    protected readonly step = signal<'form' | 'verify'>('form');
    protected readonly phone = signal('');
    protected readonly password = signal('');
    protected readonly name = signal('');
    protected readonly code = signal('');
    protected readonly loading = signal(false);
    protected readonly error = signal<string | null>(null);

    protected readonly canRegister = computed(
        () =>
            this.phone().trim().length > 0 &&
            this.password().length > 0 &&
            this.name().trim().length > 0,
    );
    protected readonly canVerify = computed(() => this.code().trim().length > 0);

    protected t(key: string): string {
        return this.i18n.t(key);
    }

    protected register(): void {
        if (!this.canRegister() || this.loading()) {
            return;
        }
        this.loading.set(true);
        this.error.set(null);
        this.api.register(this.phone().trim(), this.password(), this.name().trim()).subscribe({
            next: () => {
                this.loading.set(false);
                this.step.set('verify');
            },
            error: () => {
                this.error.set(this.t('auth.error'));
                this.loading.set(false);
            },
        });
    }

    protected verify(): void {
        if (!this.canVerify() || this.loading()) {
            return;
        }
        this.loading.set(true);
        this.error.set(null);
        this.api.verifyOtp(this.phone().trim(), this.code().trim()).subscribe({
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
