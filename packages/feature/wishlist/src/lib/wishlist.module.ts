import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WishlistController } from './wishlist.controller';
import { WishlistRepository } from './wishlist.repository';
import { Wishlist, WishlistSchema } from './wishlist.schema';
import { WishlistService } from './wishlist.service';

/**
 * Модуль вишлиста (Foundations §15). Один документ на пользователя.
 * Зависит только от kit/domain (граница feature → не импортирует другие feature).
 */
@Module({
    imports: [MongooseModule.forFeature([{ name: Wishlist.name, schema: WishlistSchema }])],
    controllers: [WishlistController],
    providers: [WishlistRepository, WishlistService],
    exports: [WishlistService],
})
export class WishlistModule {}
