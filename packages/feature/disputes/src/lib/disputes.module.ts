import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Dispute, DisputeSchema } from './dispute.schema';
import { DisputesController } from './disputes.controller';
import { DisputesRepository } from './disputes.repository';
import { DisputesService } from './disputes.service';

/**
 * Модуль споров (Foundations §15, Stage 17). НЕ @Global. AuditServiceContract
 * приходит глобально из feature `audit` по DI. Зависит только от kit/domain
 * (граница feature → не импортирует другие feature напрямую).
 */
@Module({
    imports: [MongooseModule.forFeature([{ name: Dispute.name, schema: DisputeSchema }])],
    controllers: [DisputesController],
    providers: [DisputesRepository, DisputesService],
    exports: [DisputesService],
})
export class DisputesModule {}
