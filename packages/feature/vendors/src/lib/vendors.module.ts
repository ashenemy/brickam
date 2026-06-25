import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Vendor, VendorSchema } from './vendor.schema';
import { VendorsController } from './vendors.controller';
import { VendorsRepository } from './vendors.repository';
import { VendorsService } from './vendors.service';
import { VendorsAdminController } from './vendors-admin.controller';

/**
 * Модуль вендоров (Foundations §15, Stage 15). НЕ @Global. Зависит только от
 * kit/domain (граница feature → не импортирует другие feature). Экспортирует
 * VendorsService для денормализации рейтинга из reviews.
 */
@Module({
    imports: [MongooseModule.forFeature([{ name: Vendor.name, schema: VendorSchema }])],
    controllers: [VendorsController, VendorsAdminController],
    providers: [VendorsRepository, VendorsService],
    exports: [VendorsService],
})
export class VendorsModule {}
