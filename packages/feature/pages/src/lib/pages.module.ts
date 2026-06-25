import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Page, PageSchema } from './page.schema';
import { PagesController } from './pages.controller';
import { PagesRepository } from './pages.repository';
import { PagesService } from './pages.service';
import { PagesAdminController } from './pages-admin.controller';

/**
 * Модуль статических CMS-страниц (Foundations §15). Публичное чтение
 * опубликованных страниц + админ-CRUD. НЕ @Global — audit приходит глобально
 * по DI-контракту. Зависит только от kit/domain (граница feature).
 */
@Module({
    imports: [MongooseModule.forFeature([{ name: Page.name, schema: PageSchema }])],
    controllers: [PagesController, PagesAdminController],
    providers: [PagesRepository, PagesService],
    exports: [PagesService],
})
export class PagesModule {}
