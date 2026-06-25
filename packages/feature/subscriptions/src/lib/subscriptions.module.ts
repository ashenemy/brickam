import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Subscription, SubscriptionSchema } from './subscription.schema';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsRepository } from './subscriptions.repository';
import { SubscriptionsService } from './subscriptions.service';

/**
 * Модуль подписок вендоров (Foundations §15, Stage 15). НЕ @Global. Зависит
 * только от kit/domain (граница feature → не импортирует другие feature).
 */
@Module({
    imports: [MongooseModule.forFeature([{ name: Subscription.name, schema: SubscriptionSchema }])],
    controllers: [SubscriptionsController],
    providers: [SubscriptionsRepository, SubscriptionsService],
    exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
