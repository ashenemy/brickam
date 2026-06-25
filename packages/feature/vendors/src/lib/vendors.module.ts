import { VendorsServiceContract } from '@brickam/domain-kit';
import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Vendor, VendorSchema } from './vendor.schema';
import { VendorsController } from './vendors.controller';
import { VendorsRepository } from './vendors.repository';
import { VendorsService } from './vendors.service';
import { VendorsAdminController } from './vendors-admin.controller';

/**
 * Модуль вендоров (Foundations §15). @Global — VendorsServiceContract нужен
 * глобально: `auth` (онбординг owner→createForOwner) и `reviews` (денормализация
 * рейтинга→setRating). Зависит только от kit/domain (граница feature).
 */
@Global()
@Module({
    imports: [MongooseModule.forFeature([{ name: Vendor.name, schema: VendorSchema }])],
    controllers: [VendorsController, VendorsAdminController],
    providers: [
        VendorsRepository,
        VendorsService,
        { provide: VendorsServiceContract, useExisting: VendorsService },
    ],
    exports: [VendorsService, VendorsServiceContract],
})
export class VendorsModule {}
