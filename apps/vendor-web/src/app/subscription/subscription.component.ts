import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { BadgeComponent, ButtonComponent } from '@brickam/ui-kit';
import {
    type Subscription,
    SubscriptionApiService,
    type SubscriptionPlan,
} from './subscription-api.service';

/**
 * Подписка вендора: текущий план (free/pro) + переключатель на другой тариф.
 */
@Component({
    selector: 'app-subscription',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonComponent, BadgeComponent],
    template: `
        <section class="flex flex-col gap-8 max-w-xl">
            <h1 class="text-text-primary" style="font: var(--type-display)">
                {{ t('vendor.subscription.title') }}
            </h1>

            @if (error()) {
                <p class="text-danger" role="alert">{{ error() }}</p>
            }

            @if (loading()) {
                <p class="text-text-secondary">{{ t('vendor.common.loading') }}</p>
            } @else if (sub(); as s) {
                <div class="flex flex-col gap-4 rounded-md p-5 bg-surface-card">
                    <div class="flex items-center gap-3">
                        <span class="text-text-secondary">{{ t('vendor.subscription.current') }}</span>
                        <bh-badge [tone]="s.plan === 'pro' ? 'accent' : 'neutral'">
                            {{ s.plan === 'pro' ? t('vendor.subscription.plan.pro') : t('vendor.subscription.plan.free') }}
                        </bh-badge>
                    </div>
                    <div>
                        <bh-button
                            variant="primary"
                            [disabled]="switching()"
                            (clicked)="switchPlan(s)"
                        >
                            {{ switching()
                                ? t('vendor.subscription.switching')
                                : t('vendor.subscription.switchTo') + ' ' + (s.plan === 'pro' ? t('vendor.subscription.plan.free') : t('vendor.subscription.plan.pro')) }}
                        </bh-button>
                    </div>
                </div>
            }
        </section>
    `,
})
export class SubscriptionComponent {
    private readonly api = inject(SubscriptionApiService);
    private readonly i18n = inject(LanguageService);

    protected readonly sub = signal<Subscription | null>(null);
    protected readonly loading = signal(true);
    protected readonly switching = signal(false);
    protected readonly error = signal<string | null>(null);

    constructor() {
        this.api.get().subscribe({
            next: (s) => {
                this.sub.set(s);
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(this.errMsg(err));
                this.loading.set(false);
            },
        });
    }

    protected t(key: string): string {
        return this.i18n.t(key);
    }

    protected switchPlan(current: Subscription): void {
        if (this.switching()) {
            return;
        }
        const next: SubscriptionPlan = current.plan === 'pro' ? 'free' : 'pro';
        this.switching.set(true);
        this.error.set(null);
        this.api.setPlan(next).subscribe({
            next: (s) => {
                this.sub.set(s);
                this.switching.set(false);
            },
            error: (err) => {
                this.error.set(this.errMsg(err));
                this.switching.set(false);
            },
        });
    }

    private errMsg(err: unknown): string {
        if (err && typeof err === 'object' && 'error' in err) {
            const body = (err as { error?: { message?: string } }).error;
            if (body?.message) {
                return body.message;
            }
        }
        return this.t('vendor.common.error');
    }
}
