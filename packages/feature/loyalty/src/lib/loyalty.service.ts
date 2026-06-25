import { NotFoundException } from '@brickam/core-kit';
import {
    type LoyaltyBasis,
    type LoyaltyDiscountPreview,
    type LoyaltyMetric,
    LoyaltyServiceContract,
    UsersServiceContract,
} from '@brickam/domain-kit';
import { Injectable } from '@nestjs/common';
import type {
    CreateProgramData,
    LoyaltyProgramView,
    LoyaltyStatusView,
    Tier,
    UpdateProgramData,
} from '../@types';
import { DEFAULT_PROGRAM } from './default-program';
import { LoyaltyLedgerRepository } from './loyalty-ledger.repository';
import type { LoyaltyProgramDocument } from './loyalty-program.schema';
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

    /** Все программы (админ-конструктор). */
    listPrograms(): Promise<LoyaltyProgramDocument[]> {
        return this.programs.findAllPrograms();
    }

    /** Создаёт программу (по умолчанию НЕ активна). */
    createProgram(dto: CreateProgramData): Promise<LoyaltyProgramDocument> {
        return this.programs.create({
            basis: dto.basis,
            tiers: dto.tiers,
            active: false,
        }) as unknown as Promise<LoyaltyProgramDocument>;
    }

    /** Обновляет программу по id (basis/tiers). */
    async updateProgram(id: string, dto: UpdateProgramData): Promise<LoyaltyProgramDocument> {
        const updated = await this.programs.updateById(id, {
            ...(dto.basis !== undefined ? { basis: dto.basis } : {}),
            ...(dto.tiers !== undefined ? { tiers: dto.tiers } : {}),
        });
        if (!updated) {
            throw new NotFoundException();
        }
        return updated;
    }

    /**
     * Активирует программу `id`: сначала снимает active со всех (`deactivateAll`),
     * затем ставит active этой — гарантирует ровно одну активную. Кеша нет:
     * `getActiveProgram` читает `findActive` из БД, поэтому новая программа сразу
     * применяется к скидке покупателя на следующем заказе.
     */
    async activateProgram(id: string): Promise<LoyaltyProgramDocument> {
        await this.programs.deactivateAll();
        const activated = await this.programs.setActive(id, true);
        if (!activated) {
            throw new NotFoundException();
        }
        return activated;
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
