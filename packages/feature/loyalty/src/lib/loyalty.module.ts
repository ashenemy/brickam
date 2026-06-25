import { LoyaltyServiceContract } from '@brickam/domain-kit';
import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyLedgerRepository } from './loyalty-ledger.repository';
import { LoyaltyLedger, LoyaltyLedgerSchema } from './loyalty-ledger.schema';
import { LoyaltyProgram, LoyaltyProgramSchema } from './loyalty-program.schema';
import { LoyaltyProgramsRepository } from './loyalty-programs.repository';

/**
 * Модуль лояльности (Foundations §11, §15, Stage 12). @Global — orders зависит
 * от `LoyaltyServiceContract` глобально. UsersServiceContract инжектится
 * глобально из feature `users`. Зависит только от kit/domain (граница feature).
 */
@Global()
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: LoyaltyProgram.name, schema: LoyaltyProgramSchema },
            { name: LoyaltyLedger.name, schema: LoyaltyLedgerSchema },
        ]),
    ],
    controllers: [LoyaltyController],
    providers: [
        LoyaltyProgramsRepository,
        LoyaltyLedgerRepository,
        LoyaltyService,
        // Контракт для orders: расчёт скидки лояльности и фиксация заказа.
        { provide: LoyaltyServiceContract, useExisting: LoyaltyService },
    ],
    exports: [LoyaltyService, LoyaltyServiceContract],
})
export class LoyaltyModule {}
