import { ForbiddenException } from '@brickam/core-kit';
import { OrdersAnalyticsContract, type PlatformAnalyticsSummary, Role } from '@brickam/domain-kit';
import { Auth, type AuthUser, CurrentUser } from '@brickam/server-kit';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

const DEFAULT_PERIOD_DAYS = 30;

/**
 * Платформенная аналитика для админа (Foundations §14, §17). GMV, выручка
 * платформы (= комиссии), число заказов за период. Гейт по роли admin.
 */
@ApiTags('admin')
@Controller('admin/analytics')
@Auth()
export class AdminAnalyticsController {
    constructor(private readonly orders: OrdersAnalyticsContract) {}

    private requireAdmin(user: AuthUser | undefined): void {
        if (user?.role !== Role.Admin) {
            throw new ForbiddenException('errors.admin.notAdmin');
        }
    }

    @Get()
    async summary(
        @CurrentUser() user: AuthUser | undefined,
        @Query() query: AnalyticsQueryDto,
    ): Promise<PlatformAnalyticsSummary> {
        this.requireAdmin(user);
        const to = query.to ? new Date(query.to) : new Date();
        const from = query.from
            ? new Date(query.from)
            : new Date(to.getTime() - DEFAULT_PERIOD_DAYS * 24 * 60 * 60 * 1000);
        return this.orders.platformSummary(from, to);
    }
}
