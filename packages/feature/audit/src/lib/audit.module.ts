import { AuditServiceContract } from '@brickam/domain-kit';
import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditLog, AuditLogSchema } from './audit-log.schema';
import { AuditLogsRepository } from './audit-logs.repository';

/**
 * Модуль аудит-лога (Foundations §15, Stage 17). @Global — реализация
 * `AuditServiceContract` доступна всем фичам по DI. Зависит только от
 * kit/domain.
 */
@Global()
@Module({
    imports: [MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }])],
    controllers: [AuditController],
    providers: [
        AuditLogsRepository,
        AuditService,
        // Контракт аудита для админ-фич: события пишутся только через контракт.
        { provide: AuditServiceContract, useExisting: AuditService },
    ],
    exports: [AuditService, AuditServiceContract],
})
export class AuditModule {}
