import { Auth, CurrentUser } from '@brickam/server-kit';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { ReviewContract, ReviewListView } from '../@types';
import { CreateReviewDto, ModerateReviewDto, ReviewDto, ReviewSummaryDto } from './dto/review.dto';
import { Public } from './public.decorator';
import { ReviewsService } from './reviews.service';

/** Маршруты отзывов и рейтингов (Foundations §15, Stage 7). */
@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) {}

    /** Создаёт отзыв по завершённому саб-заказу текущего покупателя. */
    @Post()
    @Auth()
    @ApiOkResponse({ type: ReviewDto, description: 'Созданный отзыв' })
    create(
        @CurrentUser('id') buyerId: string,
        @Body() dto: CreateReviewDto,
    ): Promise<ReviewContract> {
        return this.reviewsService.create(buyerId, dto);
    }

    /** Меняет статус модерации отзыва (права админа — guard позже). */
    @Patch(':id/status')
    @Auth()
    @ApiOkResponse({ type: ReviewDto, description: 'Обновлённый отзыв' })
    setStatus(@Param('id') id: string, @Body() dto: ModerateReviewDto): Promise<ReviewContract> {
        return this.reviewsService.setStatus(id, dto.status);
    }

    /** Опубликованные отзывы вендора с агрегатом рейтинга. */
    @Get('vendor/:vendorId')
    @Public()
    @ApiOkResponse({ type: ReviewSummaryDto, description: 'Отзывы и рейтинг вендора' })
    listByVendor(@Param('vendorId') vendorId: string): Promise<ReviewListView> {
        return this.reviewsService.listByVendor(vendorId);
    }

    /** Опубликованные отзывы товара с агрегатом рейтинга. */
    @Get('product/:productId')
    @Public()
    @ApiOkResponse({ type: ReviewSummaryDto, description: 'Отзывы и рейтинг товара' })
    listByProduct(@Param('productId') productId: string): Promise<ReviewListView> {
        return this.reviewsService.listByProduct(productId);
    }
}
