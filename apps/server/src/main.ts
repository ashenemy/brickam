import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppConfigService } from '@brickam/config-kit';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

const buildSwaggerConfig = () =>
    new DocumentBuilder()
        .setTitle('BuildHub API')
        .setDescription('API маркетплейса стройматериалов BuildHub')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('health')
        .build();

async function bootstrap(): Promise<void> {
    // Режим экспорта OpenAPI для генерации api-kit: preview-граф без подключения к Mongo.
    const exporting = process.env.OPENAPI_EXPORT === '1';
    if (exporting) {
        const previewApp = await NestFactory.create(AppModule, { preview: true, logger: false });
        // Префикс мирорится с дефолтом config.server.globalPrefix (провайдеры в preview не подняты).
        previewApp.setGlobalPrefix('api');
        const document = SwaggerModule.createDocument(previewApp, buildSwaggerConfig());
        const outPath = resolve(process.cwd(), 'packages/api-kit/openapi.json');
        writeFileSync(outPath, JSON.stringify(document, null, 2));
        await previewApp.close();
        Logger.log(`OpenAPI экспортирован → ${outPath}`, 'OpenAPI');
        return;
    }

    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    const config = app.get(AppConfigService);
    const { globalPrefix, port, corsOrigins } = config.server;

    app.setGlobalPrefix(globalPrefix);
    app.enableCors({ origin: corsOrigins, credentials: true });

    const document = SwaggerModule.createDocument(app, buildSwaggerConfig());
    SwaggerModule.setup(`${globalPrefix}/docs`, app, document, {
        jsonDocumentUrl: `${globalPrefix}/docs-json`,
    });

    await app.listen(port);
    Logger.log(
        `🚀 BuildHub API: http://localhost:${port}/${globalPrefix} (docs: /${globalPrefix}/docs)`,
        'Bootstrap',
    );
}

void bootstrap();
