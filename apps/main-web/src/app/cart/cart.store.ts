import { isPlatformBrowser } from '@angular/common';
import { computed, Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { catchError, of } from 'rxjs';
import { SessionStore } from '../auth/session.store';
import { CartApiService } from './cart-api.service';
import type { Cart, CartDiscountSnapshot, CartItem } from './models';

const STORAGE_KEY = 'brickam.cart';

/** Снимок для гостевой позиции (цена/продавец/название берём из карточки товара). */
export interface CartItemSnapshot {
    vendorId: string;
    priceSnapshot: number;
    titleSnapshot?: CartItem['titleSnapshot'];
}

/**
 * Глобальное состояние корзины (signals). Работает для всех:
 *  - гость → локально (localStorage), без API;
 *  - авторизованный → API (ответ сервера применяется к сигналу).
 * После добавления показывает снакбар. Суммы — в AMD; конвертация — только на показе.
 */
@Injectable({ providedIn: 'root' })
export class CartStore {
    private readonly api = inject(CartApiService);
    private readonly session = inject(SessionStore);
    private readonly snack = inject(MatSnackBar);
    private readonly i18n = inject(LanguageService);
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    readonly items = signal<CartItem[]>([]);
    readonly loading = signal(false);

    /** Общее количество единиц во всех позициях (для бейджа). */
    readonly count = computed(() => this.items().reduce((sum, i) => sum + i.qty, 0));

    /** Сумма без скидок (qty × priceSnapshot). */
    readonly subtotal = computed(() =>
        this.items().reduce((sum, i) => sum + i.priceSnapshot * i.qty, 0),
    );

    /** Суммарная скидка по всем позициям. */
    readonly discountTotal = computed(() =>
        this.items().reduce((sum, i) => sum + lineDiscount(i) * i.qty, 0),
    );

    /** Итог к оплате (subtotal − скидки). */
    readonly total = computed(() => Math.max(0, this.subtotal() - this.discountTotal()));

    /** Пуста ли корзина. */
    readonly isEmpty = computed(() => this.items().length === 0);

    constructor() {
        // Гость — восстановить локальную корзину сразу.
        if (this.isBrowser && !this.session.isAuthenticated()) {
            this.items.set(this.readLocal());
        }
    }

    private get guest(): boolean {
        return !this.session.isAuthenticated();
    }

    /** Загрузить корзину: авторизованный — с сервера, гость — из localStorage. */
    load(): void {
        if (this.session.isAuthenticated()) {
            this.api
                .get()
                .pipe(catchError(() => of(null)))
                .subscribe((cart) => {
                    if (cart) {
                        this.setFromCart(cart);
                    }
                });
        } else if (this.isBrowser) {
            this.items.set(this.readLocal());
        }
    }

    /** Добавить товар (+снакбар). Гость требует snapshot (цена/продавец/название). */
    addItem(productId: string, qty = 1, snapshot?: CartItemSnapshot): void {
        if (this.guest) {
            this.items.update((items) => {
                const existing = items.find((i) => i.productId === productId);
                if (existing) {
                    return items.map((i) =>
                        i.productId === productId ? { ...i, qty: i.qty + qty } : i,
                    );
                }
                if (!snapshot) {
                    return items;
                }
                const item: CartItem = {
                    productId,
                    vendorId: snapshot.vendorId,
                    qty,
                    priceSnapshot: snapshot.priceSnapshot,
                };
                if (snapshot.titleSnapshot) {
                    item.titleSnapshot = snapshot.titleSnapshot;
                }
                return [...items, item];
            });
            this.persistLocal();
        } else {
            this.run(this.api.addItem(productId, qty));
        }
        this.notifyAdded();
    }

    /** Изменить количество позиции. qty ≤ 0 трактуется как удаление. */
    updateQty(productId: string, qty: number): void {
        if (qty <= 0) {
            this.removeItem(productId);
            return;
        }
        if (this.guest) {
            this.items.update((items) =>
                items.map((i) => (i.productId === productId ? { ...i, qty } : i)),
            );
            this.persistLocal();
        } else {
            this.run(this.api.updateQty(productId, qty));
        }
    }

    /** Увеличить количество позиции на 1. */
    increment(productId: string): void {
        const item = this.items().find((i) => i.productId === productId);
        this.updateQty(productId, (item?.qty ?? 0) + 1);
    }

    /** Уменьшить количество позиции на 1 (до удаления при 0). */
    decrement(productId: string): void {
        const item = this.items().find((i) => i.productId === productId);
        this.updateQty(productId, (item?.qty ?? 1) - 1);
    }

    /** Удалить позицию из корзины. */
    removeItem(productId: string): void {
        if (this.guest) {
            this.items.update((items) => items.filter((i) => i.productId !== productId));
            this.persistLocal();
        } else {
            this.run(this.api.removeItem(productId));
        }
    }

    /** Очистить корзину. */
    clear(): void {
        if (this.guest) {
            this.items.set([]);
            this.persistLocal();
        } else {
            this.run(this.api.clear());
        }
    }

    /** Сбросить локальное состояние (например, после оформления). */
    reset(): void {
        this.items.set([]);
        if (this.guest) {
            this.persistLocal();
        }
    }

    private notifyAdded(): void {
        this.snack.open(this.tr('cart.added', 'Added to cart'), '', {
            duration: 2500,
            panelClass: 'bh-snack-success',
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
        });
    }

    private tr(key: string, fallback: string): string {
        const value = this.i18n.t(key);
        return value === key ? fallback : value;
    }

    private readLocal(): CartItem[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? (JSON.parse(raw) as CartItem[]) : [];
        } catch {
            return [];
        }
    }

    private persistLocal(): void {
        if (!this.isBrowser) {
            return;
        }
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items()));
        } catch {
            // приватный режим/недоступный storage — игнорируем
        }
    }

    private run(obs: ReturnType<CartApiService['get']>): void {
        this.loading.set(true);
        obs.pipe(catchError(() => of(null))).subscribe((cart) => {
            if (cart) {
                this.setFromCart(cart);
            }
            this.loading.set(false);
        });
    }

    private setFromCart(cart: Cart): void {
        this.items.set(cart.items ?? []);
    }
}

/** Скидка на единицу товара из снимка скидки позиции (в AMD). */
function lineDiscount(item: CartItem): number {
    const d: CartDiscountSnapshot | undefined = item.discountSnapshot;
    if (!d) {
        return 0;
    }
    if (d.type === 'percent') {
        return Math.round((item.priceSnapshot * d.value) / 100);
    }
    return Math.min(item.priceSnapshot, d.value);
}
