import {
    type LoyaltyBasis,
    type LoyaltyDiscountPreview,
    type LoyaltyMetric,
    LoyaltyServiceContract,
    UsersServiceContract,
} from '@brickam/domain-kit';
import { Injectable } from '@nestjs/common';
import type { LoyaltyProgramView, LoyaltyStatusView, Tier } from '../@types';
import { DEFAULT_PROGRAM } from './default-program';
import { LoyaltyLedgerRepository } from './loyalty-ledger.repository';
import { LoyaltyProgramsRepository } from './loyalty-programs.repository';
import { computeLoyaltyDiscount, selectTier, tierId } from './tier.util';

/**
 * Сервис лояльности (Foundations §11, §15, Stage 12). Скидку лояльности несёт
 * ПЛАТФОРМА: комиссия и payout вендора считаются ДО неё в orders и не меняются —
 * здесь только расчёт суммы скидки и рост метрики. Метрика покупателя живёт в
 * users.loyalty и доступна только через `UsersServiceContract`.
 */
@Injectable()
export class LoyaltyService implements LoyaltyServiceContract {
    constructor(
        private readonly programs: LoyaltyProgramsRepository,
        private readonly ledger: LoyaltyLedgerRepository,
        private readonly users: UsersServiceContract,
    ) {}

    /** Активная программа из БД либо ★-дефолт, если активной нет. */
    async getActiveProgram(): Promise<LoyaltyProgramView> {
        const doc = await this.programs.findActive();
        if (!doc) {
            return DEFAULT_PROGRAM;
        }
        return {
            basis: doc.basis,
            tiers: doc.tiers.map((tier) => ({
                level: tier.level,
                name: tier.name,
                threshold: tier.threshold,
                discountType: tier.discountType,
                discountValue: tier.discountValue,
            })),
        };
    }

    /** Значение метрики по basis программы. */
    metricValue(program: LoyaltyProgramView, metric: LoyaltyMetric): number {
        return program.basis === 'total_spend' ? metric.totalSpend : metric.totalOrders;
    }

    /**
     * Предпросмотр скидки по ТЕКУЩЕМУ уровню покупателя (до этого заказа), от
     * суммы после товарных скидок. Скидка > 0 → {loyaltyDiscount, tierId};
     * иначе {loyaltyDiscount: 0, tierId? текущего уровня}.
     */
    async previewDiscount(buyerId: string, amount: number): Promise<LoyaltyDiscountPreview> {
        const program = await this.getActiveProgram();
        const metric = await this.users.getLoyaltyMetric(buyerId);
        const tier = selectTier(program.tiers, this.metricValue(program, metric));
        if (!tier) {
            return { loyaltyDiscount: 0 };
        }
        const loyaltyDiscount = computeLoyaltyDiscount(amount, tier);
        if (loyaltyDiscount > 0) {
            return { loyaltyDiscount, tierId: tierId(tier) };
        }
        return { loyaltyDiscount: 0, tierId: tierId(tier) };
    }

    /**
     * Фиксирует завершённый заказ: растит метрику по basis (totalSpend всегда
     * += orderTotal, totalOrders всегда += 1 — для информации), пересчитывает
     * уровень, обновляет users.loyalty и пишет запись в ledger.
     */
    async recordCompletedOrder(buyerId: string, orderTotal: number): Promise<void> {
        const program = await this.getActiveProgram();
        const metric0 = await this.users.getLoyaltyMetric(buyerId);

        const newMetric: LoyaltyMetric = {
            totalSpend: metric0.totalSpend + orderTotal,
            totalOrders: metric0.totalOrders + 1,
        };
        const newTier = selectTier(program.tiers, this.metricValue(program, newMetric));
        const newTierId = newTier ? tierId(newTier) : undefined;

        await this.users.updateLoyalty(buyerId, {
            totalSpend: newMetric.totalSpend,
            totalOrders: newMetric.totalOrders,
            ...(newTierId !== undefined ? { currentTierId: newTierId } : {}),
        });

        const delta = this.basisDelta(program.basis, orderTotal);
        await this.ledger.create({
            userId: buyerId,
            basis: program.basis,
            delta,
            ...(newTierId !== undefined ? { tierId: newTierId } : {}),
            at: new Date(),
        });
    }

    /** Статус лояльности для UI: метрика, текущий и следующий уровень + остаток. */
    async getStatus(buyerId: string): Promise<LoyaltyStatusView> {
        const program = await this.getActiveProgram();
        const metric = await this.users.getLoyaltyMetric(buyerId);
        const value = this.metricValue(program, metric);
        const currentTier = selectTier(program.tiers, value);
        const nextTier = this.selectNextTier(program.tiers, value);

        const status: LoyaltyStatusView = { metric, basis: program.basis };
        if (currentTier !== undefined) {
            status.currentTier = currentTier;
        }
        if (nextTier !== undefined) {
            status.nextTier = nextTier;
            status.toNext = Math.max(0, nextTier.threshold - value);
        }
        return status;
    }

    /** Прирост метрики для ledger: total_spend → orderTotal; order_count → 1. */
    private basisDelta(basis: LoyaltyBasis, orderTotal: number): number {
        return basis === 'total_spend' ? orderTotal : 1;
    }

    /** Ближайший уровень с `threshold > value` (минимальный из таких). */
    private selectNextTier(tiers: Tier[], value: number): Tier | undefined {
        let next: Tier | undefined;
        for (const tier of tiers) {
            if (tier.threshold > value && (next === undefined || tier.threshold < next.threshold)) {
                next = tier;
            }
        }
        return next;
    }
}
