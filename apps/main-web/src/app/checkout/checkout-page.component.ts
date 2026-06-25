import { isPlatformBrowser } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    effect,
    inject,
    type OnInit,
    PLATFORM_ID,
    signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { ButtonComponent, InputComponent } from '@brickam/ui-kit';
import { CartStore } from '../cart/cart.store';
import { CurrencyDisplayPipe } from '../currency/currency-display.pipe';
import type { CheckoutAddress } from '../orders/models';
import { OrdersApiService } from '../orders/orders-api.service';

/**
 * Оформление заказа (route /checkout, приватный). Форма адреса доставки + итоги
 * из корзины. По сабмиту: checkout → pay → переход на /orders/:id и очистка
 * корзины. Пустая корзина → редирект на /cart.
 */
@Component({
    selector: 'app-checkout-page',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [InputComponent, ButtonComponent, CurrencyDisplayPipe],
    template: `
        <section class="flex flex-col gap-6">
            <header class="flex flex-col gap-2">
                <h1 class="text-text-primary" style="font: var(--type-hero)">{{ t('title') }}</h1>
            </header>

            <div class="flex flex-col gap-8 lg:flex-row">
                <!-- Форма адреса -->
                <form class="flex flex-1 flex-col gap-4" (submit)="submit($event)">
                    <bh-input
                        [label]="t('label')"
                        [(value)]="label"
                        [disabled]="loading()"
                        [error]="fieldError('label')"
                    />
                    <bh-input
                        [label]="t('region')"
                        [(value)]="region"
                        [disabled]="loading()"
                        [error]="fieldError('region')"
                    />
                    <bh-input
                        [label]="t('city')"
                        [(value)]="city"
                        [disabled]="loading()"
                        [error]="fieldError('city')"
                    />
                    <bh-input
                        [label]="t('line1')"
                        [(value)]="line1"
                        [disabled]="loading()"
                        [error]="fieldError('line1')"
                    />
                    <bh-input
                        [label]="t('line2')"
                        [(value)]="line2"
                        [disabled]="loading()"
                    />
                    <bh-input
                        [label]="t('phone')"
                        type="tel"
                        [(value)]="phone"
                        [disabled]="loading()"
                        [error]="fieldError('phone')"
                    />

                    @if (error()) {
                        <p
                            class="text-danger"
                            style="font: var(--type-caption)"
                            data-testid="checkout-error"
                        >
                            {{ t('error') }}
                        </p>
                    }

                    <bh-button
                        type="submit"
                        variant="primary"
                        size="lg"
                        [block]="true"
                        [disabled]="loading()"
                        data-testid="checkout-submit"
                    >
                        {{ loading() ? t('processing') : t('placeOrder') }}
                    </bh-button>
                </form>

                <!-- Итоги -->
                <aside
                    class="flex h-fit w-full flex-col gap-2 rounded-xl bg-surface-card p-5 lg:w-80"
                    data-testid="checkout-summary"
                >
                    <h2 class="text-text-primary" style="font: var(--type-section)">
                        {{ t('summary') }}
                    </h2>
                    <div class="flex justify-between text-text-secondary" style="font: var(--type-product)">
                        <span>{{ t('subtotal') }}</span>
                        <span>{{ cart.subtotal() | currencyDisplay }}</span>
                    </div>
                    @if (cart.discountTotal() > 0) {
                        <div class="flex justify-between text-success" style="font: var(--type-product)">
                            <span>{{ t('discount') }}</span>
                            <span>−{{ cart.discountTotal() | currencyDisplay }}</span>
                        </div>
                    }
                    <div
                        class="mt-2 flex justify-between border-t border-[var(--border-subtle)] pt-3 text-text-primary"
                        style="font: var(--type-price)"
                    >
                        <span>{{ t('total') }}</span>
                        <span>{{ cart.total() | currencyDisplay }}</span>
                    </div>
                </aside>
            </div>
        </section>
    `,
})
export class CheckoutPageComponent implements OnInit {
    protected readonly cart = inject(CartStore);
    private readonly ordersApi = inject(OrdersApiService);
    private readonly router = inject(Router);
    private readonly i18n = inject(LanguageService);
    private readonly title = inject(Title);

    protected readonly label = signal('');
    protected readonly region = signal('');
    protected readonly city = signal('');
    protected readonly line1 = signal('');
    protected readonly line2 = signal('');
    protected readonly phone = signal('');

    protected readonly loading = signal(false);
    protected readonly error = signal(false);
    protected readonly submitted = signal(false);
    // Корзина загружена с сервера хотя бы раз (чтобы не редиректить до загрузки).
    private readonly loaded = signal(false);
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    constructor() {
        // Пустая корзина после загрузки → редирект на /cart (только в браузере,
        // чтобы не было ложного редиректа во время оформления/SSR).
        effect(() => {
            if (
                this.isBrowser &&
                this.loaded() &&
                this.cart.isEmpty() &&
                !this.loading() &&
                !this.submitted()
            ) {
                void this.router.navigate(['/cart']);
            }
        });
    }

    ngOnInit(): void {
        this.title.setTitle(this.t('title'));
        // Подгружаем корзину; если по факту пуста — эффект редиректит на /cart.
        if (this.isBrowser) {
            this.cart.load();
            this.loaded.set(true);
        }
    }

    /** Все обязательные поля заполнены. */
    private valid(): boolean {
        return (
            this.label().trim().length > 0 &&
            this.region().trim().length > 0 &&
            this.city().trim().length > 0 &&
            this.line1().trim().length > 0 &&
            this.phone().trim().length > 0
        );
    }

    protected fieldError(
        field: 'label' | 'region' | 'city' | 'line1' | 'phone',
    ): string | undefined {
        if (!this.submitted()) {
            return undefined;
        }
        const map: Record<typeof field, string> = {
            label: this.label(),
            region: this.region(),
            city: this.city(),
            line1: this.line1(),
            phone: this.phone(),
        };
        return map[field].trim().length === 0 ? this.t('required') : undefined;
    }

    protected submit(event: Event): void {
        event.preventDefault();
        this.submitted.set(true);
        if (this.loading()) {
            return;
        }
        // Пустая корзина — на /cart.
        if (this.cart.isEmpty()) {
            void this.router.navigate(['/cart']);
            return;
        }
        if (!this.valid()) {
            return;
        }

        const line2 = this.line2().trim();
        const address: CheckoutAddress = {
            label: this.label().trim(),
            region: this.region().trim(),
            city: this.city().trim(),
            line1: this.line1().trim(),
            phone: this.phone().trim(),
            ...(line2 ? { line2 } : {}),
        };

        this.loading.set(true);
        this.error.set(false);
        this.ordersApi.checkout(address).subscribe({
            next: (result) => {
                const orderId = result.order.id;
                const redirectUrl = result.payment?.redirectUrl;
                // Redirect-флоу (карты ArCa/Idram): оплата завершается на стороне
                // PSP, pay() не вызываем — перенаправляем покупателя на платёжную
                // страницу. Только в браузере (SSR-безопасно).
                if (redirectUrl) {
                    this.cart.reset();
                    if (this.isBrowser) {
                        window.location.href = redirectUrl;
                    }
                    return;
                }
                // Синхронный провайдер (mock): прежний поток — confirm → /orders/:id.
                this.ordersApi.pay(orderId).subscribe({
                    next: () => {
                        this.cart.reset();
                        this.loading.set(false);
                        void this.router.navigate(['/orders', orderId]);
                    },
                    error: () => {
                        this.error.set(true);
                        this.loading.set(false);
                    },
                });
            },
            error: () => {
                this.error.set(true);
                this.loading.set(false);
            },
        });
    }

    protected t(key: string): string {
        const full = `checkout.${key}`;
        const translated = this.i18n.t(full);
        if (translated !== full) {
            return translated;
        }
        return DEFAULTS[key] ?? key;
    }
}

const DEFAULTS: Record<string, string> = {
    title: 'Checkout',
    summary: 'Order summary',
    label: 'Address label',
    region: 'Region',
    city: 'City',
    line1: 'Address line 1',
    line2: 'Address line 2 (optional)',
    phone: 'Phone',
    required: 'Required',
    subtotal: 'Subtotal',
    discount: 'Discount',
    total: 'Total',
    placeOrder: 'Place order',
    processing: 'Processing…',
    redirecting: 'Redirecting to payment…',
    error: 'Could not place the order. Please try again.',
};
