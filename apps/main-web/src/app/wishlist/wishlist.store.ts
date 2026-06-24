import { computed, Injectable, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import type { WishlistData } from './models';
import { WishlistApiService } from './wishlist-api.service';

/**
 * Глобальное состояние вишлиста. Хранит множество id товаров (сигнал),
 * счётчик — производный. toggle оптимистично обновляет сигнал и
 * синхронизируется с API; при ошибке откатывает изменение.
 */
@Injectable({ providedIn: 'root' })
export class WishlistStore {
    private readonly api = inject(WishlistApiService);

    readonly ids = signal<Set<string>>(new Set<string>());
    readonly count = computed(() => this.ids().size);

    /** Загрузить вишлист с сервера. Безопасно при SSR/без токена (глушит ошибку). */
    load(): void {
        this.api
            .get()
            .pipe(catchError(() => of(null)))
            .subscribe((data) => {
                if (data) {
                    this.setFromData(data);
                }
            });
    }

    /** Есть ли товар в вишлисте. */
    has(productId: string): boolean {
        return this.ids().has(productId);
    }

    /** Переключить наличие товара: есть → remove, иначе → add. */
    toggle(productId: string): void {
        if (this.has(productId)) {
            this.remove(productId);
        } else {
            this.add(productId);
        }
    }

    /** Оптимистично добавить и синхронизировать с API. */
    add(productId: string): void {
        if (this.has(productId)) {
            return;
        }
        this.mutate((set) => set.add(productId));
        this.api
            .add(productId)
            .pipe(catchError(() => of(null)))
            .subscribe((data) => {
                if (data) {
                    this.setFromData(data);
                } else {
                    this.mutate((set) => set.delete(productId));
                }
            });
    }

    /** Оптимистично удалить и синхронизировать с API. */
    remove(productId: string): void {
        if (!this.has(productId)) {
            return;
        }
        this.mutate((set) => set.delete(productId));
        this.api
            .remove(productId)
            .pipe(catchError(() => of(null)))
            .subscribe((data) => {
                if (data) {
                    this.setFromData(data);
                } else {
                    this.mutate((set) => set.add(productId));
                }
            });
    }

    private setFromData(data: WishlistData): void {
        this.ids.set(new Set(data.items.map((i) => i.productId)));
    }

    private mutate(fn: (set: Set<string>) => void): void {
        this.ids.update((prev) => {
            const next = new Set(prev);
            fn(next);
            return next;
        });
    }
}
