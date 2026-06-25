import { computed, Injectable, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { LoyaltyApiService } from './loyalty-api.service';
import type { LoyaltyProgram, LoyaltyStatus } from './models';

/**
 * Глобальное состояние лояльности. `load()` тянет статус пользователя
 * (GET /loyalty/me) и публичную программу (GET /loyalty/program).
 * SSR-безопасно: ошибки/401 глушатся через catchError, status остаётся null.
 */
@Injectable({ providedIn: 'root' })
export class LoyaltyStore {
    private readonly api = inject(LoyaltyApiService);

    readonly status = signal<LoyaltyStatus | null>(null);
    readonly program = signal<LoyaltyProgram | null>(null);

    /** Название текущего уровня (или null). */
    readonly tierName = computed(() => this.status()?.currentTier?.name ?? null);

    /** Подпись активной скидки уровня: "10%" / "1500" (или null). */
    readonly discountLabel = computed(() => {
        const tier = this.status()?.currentTier;
        if (!tier) {
            return null;
        }
        return tier.discountType === 'percent' ? `${tier.discountValue}%` : `${tier.discountValue}`;
    });

    /**
     * Прогресс до следующего уровня, %. Считается как доля пройденного
     * отрезка между порогами текущего и следующего уровня:
     * progress = (threshold(next) - toNext - threshold(current)) / (threshold(next) - threshold(current)).
     * Если nextTier нет — максимальный уровень достигнут → 100%.
     */
    readonly progressPercent = computed(() => {
        const s = this.status();
        if (!s?.nextTier) {
            return 100;
        }
        const next = s.nextTier.threshold;
        const current = s.currentTier?.threshold ?? 0;
        const span = next - current;
        if (span <= 0) {
            return 100;
        }
        const toNext = s.toNext ?? 0;
        const done = span - toNext;
        const pct = Math.round((done / span) * 100);
        return Math.max(0, Math.min(100, pct));
    });

    /** Загрузить статус и программу. Безопасно при SSR/без токена. */
    load(): void {
        this.api
            .me()
            .pipe(catchError(() => of(null)))
            .subscribe((data) => {
                if (data) {
                    this.status.set(data);
                }
            });
        this.api
            .program()
            .pipe(catchError(() => of(null)))
            .subscribe((data) => {
                if (data) {
                    this.program.set(data);
                }
            });
    }
}
