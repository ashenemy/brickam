import { computed, Injectable, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { CartApiService } from './cart-api.service';
import type { Cart, CartDiscountSnapshot, CartItem } from './models';

/**
 * Глобальное состояние корзины (signals). Хранит позиции, производные счётчик/
 * суммы. Методы дёргают API и обновляют сигнал ответом сервера. SSR-безопасно:
 * load() глушит 401/ошибку через catchError (для бейджа в шапке у гостя — пусто).
 *
 * Все суммы — в AMD (как их хранит бэкенд); конвертация валюты — только на показе.
 */
@Injectable({ providedIn: 'root' })
export class CartStore {
    private readonly api = inject(CartApiService);

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

    /** Загрузить корзину с сервера. Безопасно при SSR/без токена. */
    load(): void {
        this.api
            .get()
            .pipe(catchError(() => of(null)))
            .subscribe((cart) => {
                if (cart) {
                    this.setFromCart(cart);
                }
            });
    }

    /** Добавить товар и применить ответ сервера к сигналу. */
    addItem(productId: string, qty = 1): void {
        this.run(this.api.addItem(productId, qty));
    }

    /** Изменить количество позиции. qty ≤ 0 трактуется как удаление. */
    updateQty(productId: string, qty: number): void {
        if (qty <= 0) {
            this.removeItem(productId);
            return;
        }
        this.run(this.api.updateQty(productId, qty));
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
        this.run(this.api.removeItem(productId));
    }

    /** Очистить корзину локально и на сервере. */
    clear(): void {
        this.run(this.api.clear());
    }

    /** Сбросить локальное состояние (например, после оформления). */
    reset(): void {
        this.items.set([]);
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
