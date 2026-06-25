import type { LoyaltyMetric, UsersServiceContract } from '@brickam/domain-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PROGRAM } from './default-program';
import { LoyaltyService } from './loyalty.service';
import type { LoyaltyLedgerRepository } from './loyalty-ledger.repository';
import type { LoyaltyProgramsRepository } from './loyalty-programs.repository';

const makeProgramDoc = (over: Record<string, unknown> = {}) => ({
    basis: 'total_spend',
    active: true,
    tiers: [
        { level: 1, name: 'Bronze', threshold: 0, discountType: 'percent', discountValue: 0 },
        { level: 2, name: 'Silver', threshold: 100000, discountType: 'percent', discountValue: 3 },
        { level: 3, name: 'Gold', threshold: 500000, discountType: 'percent', discountValue: 5 },
    ],
    ...over,
});

describe('LoyaltyService', () => {
    let programs: {
        findActive: ReturnType<typeof vi.fn>;
        findAllPrograms: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
        updateById: ReturnType<typeof vi.fn>;
        deactivateAll: ReturnType<typeof vi.fn>;
        setActive: ReturnType<typeof vi.fn>;
    };
    let ledger: { create: ReturnType<typeof vi.fn> };
    let users: {
        getLoyaltyMetric: ReturnType<typeof vi.fn>;
        updateLoyalty: ReturnType<typeof vi.fn>;
    };
    let service: LoyaltyService;

    const metric = (over: Partial<LoyaltyMetric> = {}): LoyaltyMetric => ({
        totalSpend: 0,
        totalOrders: 0,
        ...over,
    });

    beforeEach(() => {
        programs = {
            findActive: vi.fn().mockResolvedValue(null),
            findAllPrograms: vi.fn().mockResolvedValue([]),
            create: vi.fn().mockResolvedValue({ id: 'p1' }),
            updateById: vi.fn().mockResolvedValue({ id: 'p1' }),
            deactivateAll: vi.fn().mockResolvedValue(undefined),
            setActive: vi.fn().mockResolvedValue({ id: 'p1', active: true }),
        };
        ledger = { create: vi.fn().mockResolvedValue(undefined) };
        users = {
            getLoyaltyMetric: vi.fn().mockResolvedValue(metric()),
            updateLoyalty: vi.fn().mockResolvedValue(undefined),
        };
        service = new LoyaltyService(
            programs as unknown as LoyaltyProgramsRepository,
            ledger as unknown as LoyaltyLedgerRepository,
            users as unknown as UsersServiceContract,
        );
    });

    describe('getActiveProgram', () => {
        it('БД пусто → DEFAULT_PROGRAM', async () => {
            programs.findActive.mockResolvedValue(null);
            const program = await service.getActiveProgram();
            expect(program).toEqual(DEFAULT_PROGRAM);
        });

        it('из БД → маппит basis + tiers', async () => {
            programs.findActive.mockResolvedValue(
                makeProgramDoc({ basis: 'order_count', tiers: [makeProgramDoc().tiers[1]] }),
            );
            const program = await service.getActiveProgram();
            expect(program.basis).toBe('order_count');
            expect(program.tiers).toHaveLength(1);
            expect(program.tiers[0]?.level).toBe(2);
        });
    });

    describe('previewDiscount', () => {
        it('метрика даёт уровень со скидкой → правильная сумма', async () => {
            users.getLoyaltyMetric.mockResolvedValue(metric({ totalSpend: 250000 }));
            // Silver = 3% от 10000 = 300.
            const preview = await service.previewDiscount('b1', 10000);
            expect(preview).toEqual({ loyaltyDiscount: 300, tierId: '2' });
        });

        it('Gold: 5% от суммы', async () => {
            users.getLoyaltyMetric.mockResolvedValue(metric({ totalSpend: 600000 }));
            const preview = await service.previewDiscount('b1', 20000);
            expect(preview).toEqual({ loyaltyDiscount: 1000, tierId: '3' });
        });

        it('уровень есть, но скидка 0 (Bronze) → loyaltyDiscount 0 с tierId', async () => {
            users.getLoyaltyMetric.mockResolvedValue(metric({ totalSpend: 0 }));
            const preview = await service.previewDiscount('b1', 10000);
            expect(preview).toEqual({ loyaltyDiscount: 0, tierId: '1' });
        });

        it('нет подходящего уровня → 0 без tierId', async () => {
            programs.findActive.mockResolvedValue(
                makeProgramDoc({
                    tiers: [
                        {
                            level: 2,
                            name: 'Silver',
                            threshold: 100000,
                            discountType: 'percent',
                            discountValue: 3,
                        },
                    ],
                }),
            );
            users.getLoyaltyMetric.mockResolvedValue(metric({ totalSpend: 0 }));
            const preview = await service.previewDiscount('b1', 10000);
            expect(preview).toEqual({ loyaltyDiscount: 0 });
        });
    });

    describe('recordCompletedOrder', () => {
        it('total_spend: растит totalSpend на orderTotal, пересчитывает уровень, пишет ledger', async () => {
            users.getLoyaltyMetric.mockResolvedValue(metric({ totalSpend: 90000, totalOrders: 2 }));
            await service.recordCompletedOrder('b1', 20000);

            expect(users.updateLoyalty).toHaveBeenCalledWith('b1', {
                totalSpend: 110000,
                totalOrders: 3,
                currentTierId: '2',
            });
            expect(ledger.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'b1',
                    basis: 'total_spend',
                    delta: 20000,
                    tierId: '2',
                }),
            );
        });

        it('order_count: растит totalOrders на 1, delta=1, totalSpend тоже растёт', async () => {
            programs.findActive.mockResolvedValue(
                makeProgramDoc({
                    basis: 'order_count',
                    tiers: [
                        {
                            level: 1,
                            name: 'L1',
                            threshold: 0,
                            discountType: 'percent',
                            discountValue: 0,
                        },
                        {
                            level: 2,
                            name: 'L2',
                            threshold: 5,
                            discountType: 'percent',
                            discountValue: 2,
                        },
                    ],
                }),
            );
            users.getLoyaltyMetric.mockResolvedValue(metric({ totalSpend: 1000, totalOrders: 4 }));
            await service.recordCompletedOrder('b1', 3000);

            expect(users.updateLoyalty).toHaveBeenCalledWith('b1', {
                totalSpend: 4000,
                totalOrders: 5,
                currentTierId: '2',
            });
            expect(ledger.create).toHaveBeenCalledWith(
                expect.objectContaining({ basis: 'order_count', delta: 1, tierId: '2' }),
            );
        });
    });

    describe('getStatus', () => {
        it('возвращает метрику, текущий и следующий уровень + остаток', async () => {
            users.getLoyaltyMetric.mockResolvedValue(
                metric({ totalSpend: 120000, totalOrders: 3 }),
            );
            const status = await service.getStatus('b1');
            expect(status.basis).toBe('total_spend');
            expect(status.currentTier?.level).toBe(2);
            expect(status.nextTier?.level).toBe(3);
            expect(status.toNext).toBe(380000);
            expect(status.metric.totalSpend).toBe(120000);
        });

        it('на верхнем уровне nextTier/toNext отсутствуют', async () => {
            users.getLoyaltyMetric.mockResolvedValue(metric({ totalSpend: 900000 }));
            const status = await service.getStatus('b1');
            expect(status.currentTier?.level).toBe(3);
            expect(status.nextTier).toBeUndefined();
            expect(status.toNext).toBeUndefined();
        });
    });

    describe('admin: конструктор программ', () => {
        it('listPrograms делегирует репозиторию', async () => {
            const items = [{ id: 'p1' }];
            programs.findAllPrograms.mockResolvedValue(items);
            expect(await service.listPrograms()).toBe(items);
        });

        it('createProgram создаёт НЕ активную программу', async () => {
            await service.createProgram({ basis: 'total_spend', tiers: [] });
            expect(programs.create).toHaveBeenCalledWith(
                expect.objectContaining({ basis: 'total_spend', active: false }),
            );
        });

        it('updateProgram обновляет по id', async () => {
            programs.updateById.mockResolvedValue({ id: 'p1', basis: 'order_count' });
            await service.updateProgram('p1', { basis: 'order_count' });
            expect(programs.updateById).toHaveBeenCalledWith(
                'p1',
                expect.objectContaining({ basis: 'order_count' }),
            );
        });

        it('activateProgram деактивирует прочие и активирует одну', async () => {
            await service.activateProgram('p1');
            expect(programs.deactivateAll).toHaveBeenCalledTimes(1);
            expect(programs.setActive).toHaveBeenCalledWith('p1', true);
            // deactivateAll должен вызваться ДО setActive (ровно одна active).
            expect(programs.deactivateAll.mock.invocationCallOrder[0]).toBeLessThan(
                programs.setActive.mock.invocationCallOrder[0] as number,
            );
        });

        it('после activate getActiveProgram видит НОВУЮ активную (findActive из БД)', async () => {
            await service.activateProgram('p1');
            programs.findActive.mockResolvedValue(
                makeProgramDoc({ basis: 'order_count', tiers: [] }),
            );
            const active = await service.getActiveProgram();
            expect(active.basis).toBe('order_count');
        });
    });
});
