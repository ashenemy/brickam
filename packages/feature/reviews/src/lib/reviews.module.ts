import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from './review.schema';
import { ReviewsController } from './reviews.controller';
import { ReviewsRepository } from './reviews.repository';
import { ReviewsService } from './reviews.service';

/**
 * Модуль отзывов (Foundations §15, Stage 7). НЕ @Global — orders/catalog
 * приходят глобально по DI-контрактам. Зависит только от kit/domain
 * (граница feature → не импортирует другие feature).
 */
@Module({
    imports: [MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }])],
    controllers: [ReviewsController],
    providers: [ReviewsRepository, ReviewsService],
    exports: [ReviewsService],
})
export class ReviewsModule {}
