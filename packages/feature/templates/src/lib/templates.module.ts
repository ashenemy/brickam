import { TemplatesServiceContract } from '@brickam/domain-kit';
import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Template, TemplateSchema } from './template.schema';
import { TemplateRenderer } from './template-renderer';
import { TemplatesController } from './templates.controller';
import { TemplatesRepository } from './templates.repository';
import { TemplatesService } from './templates.service';

/**
 * Глобальный модуль шаблонов (Foundations §10). Биндит `TemplatesService` к
 * DI-токену `TemplatesServiceContract` — другие фичи (notifications, auth)
 * зависят только от контракта. Дефолтные шаблоны засеваются в OnModuleInit.
 */
@Global()
@Module({
    imports: [MongooseModule.forFeature([{ name: Template.name, schema: TemplateSchema }])],
    controllers: [TemplatesController],
    providers: [
        TemplatesRepository,
        TemplateRenderer,
        TemplatesService,
        { provide: TemplatesServiceContract, useExisting: TemplatesService },
    ],
    exports: [TemplatesService, TemplatesServiceContract, MongooseModule],
})
export class TemplatesModule {}
