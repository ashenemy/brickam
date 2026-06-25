import { ForbiddenException } from '@brickam/core-kit';
import type { OrdersAnalyticsContract } from '@brickam/domain-kit';
import { Role } from '@brickam/domain-kit';
import type { AuthUser } from '@brickam/server-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminAnalyticsController } from './admin-analytics.controller';
import type { AnalyticsQueryDto } from './dto/analytics-query.dto';

describe('AdminAnalyticsController', () => {
    let orders: { platformSummary: ReturnType<typeof vi.fn> };
    let controller: AdminAnalyticsController;

    beforeEach(() => {
        orders = {
            platformSummary: vi
                .fn()
                .mockResolvedValue({ gmv: 1000, platformRevenue: 75, orders: 3 }),
        };
        controller = new AdminAnalyticsController(orders as unknown as OrdersAnalyticsContract);
    });

    const admin = { id: 'a1', role: Role.Admin } as AuthUser;
    const buyer = { id: 'b1', role: Role.Buyer } as AuthUser;

    it('не-админ → ForbiddenException', async () => {
        await expect(controller.summary(buyer, {} as AnalyticsQueryDto)).rejects.toBeInstanceOf(
            ForbiddenException,
        );
        expect(orders.platformSummary).not.toHaveBeenCalled();
    });

    it('админ без периода → дефолт 30 дней, зовёт platformSummary', async () => {
        const result = await controller.summary(admin, {} as AnalyticsQueryDto);
        expect(result).toEqual({ gmv: 1000, platformRevenue: 75, orders: 3 });
        expect(orders.platformSummary).toHaveBeenCalledTimes(1);
        const [from, to] = orders.platformSummary.mock.calls[0] as [Date, Date];
        expect(to.getTime() - from.getTime()).toBeCloseTo(30 * 24 * 60 * 60 * 1000, -5);
    });

    it('админ с from/to → парсит даты', async () => {
        await controller.summary(admin, {
            from: '2026-01-01',
            to: '2026-02-01',
        } as AnalyticsQueryDto);
        const [from, to] = orders.platformSummary.mock.calls[0] as [Date, Date];
        expect(from.toISOString()).toContain('2026-01-01');
        expect(to.toISOString()).toContain('2026-02-01');
    });

    it('undefined user → Forbidden', async () => {
        await expect(controller.summary(undefined, {} as AnalyticsQueryDto)).rejects.toBeInstanceOf(
            ForbiddenException,
        );
    });
});
