import { resolve } from 'node:path';
import { AiSearchController, AiSearchService } from '@brickam/ai-search';
import { ConfigKitModule } from '@brickam/config-kit';
import {
    CatalogSearchContract,
    EmbeddingProvider,
    LlmProvider,
    type ProductSearchHit,
} from '@brickam/domain-kit';
import { I18nKitModule } from '@brickam/i18n-kit';
import { ServerKitModule } from '@brickam/server-kit';
import { type INestApplication, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/** LLM-мок: всегда отдаёт валидный строгий JSON (внешний AI за моком). */
@Injectable()
class FakeLlm extends LlmProvider {
    readonly name = 'fake';
    async complete(): Promise<string> {
        return JSON.stringify({
            projectType: 'ремонт ванной',
            themes: [
                { name: 'Плитка', materialCategories: ['tile'], keywords: ['плитка', 'клей'] },
                { name: 'Сантехника', materialCategories: ['plumbing'], keywords: ['смеситель'] },
            ],
        });
    }
}

@Injectable()
class FakeEmbedding extends EmbeddingProvider {
    readonly name = 'fake';
    async embed(): Promise<number[]> {
        return [0.1, 0.2, 0.3];
    }
}

const tileHit: ProductSearchHit = {
    id: 'p-tile',
    slug: 'tile-1',
    title: { hy: 'Սալիկ', ru: 'Плитка', en: 'Tile' },
    finalPrice: 4500,
    unit: 'm2',
    vendorId: 'v1',
    categoryId: 'cat-tile',
};
const glueHit: ProductSearchHit = {
    ...tileHit,
    id: 'p-glue',
    slug: 'glue-1',
    title: { hy: 'Սոսինձ', ru: 'Клей', en: 'Glue' },
};

/** Фейк поиска по каталогу: keyword и vector дают пересекающиеся хиты. */
@Injectable()
class FakeCatalogSearch extends CatalogSearchContract {
    async keywordSearch(keywords: string[]): Promise<ProductSearchHit[]> {
        return keywords.includes('плитка') ? [tileHit] : [];
    }
    async vectorSearch(): Promise<ProductSearchHit[]> {
        return [tileHit, glueHit]; // tileHit пересекается с keyword — дедуп
    }
}

@Module({
    controllers: [AiSearchController],
    providers: [
        AiSearchService,
        { provide: LlmProvider, useClass: FakeLlm },
        { provide: EmbeddingProvider, useClass: FakeEmbedding },
        { provide: CatalogSearchContract, useClass: FakeCatalogSearch },
    ],
})
class AiSearchTestModule {}

const testEnv = {
    MONGO_URI: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'e2e-access',
    JWT_REFRESH_SECRET: 'e2e-refresh',
};

describe('AI-search e2e (описание→темы→товары, внешний AI за моком)', () => {
    let app: INestApplication;
    let http: ReturnType<typeof request>;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [
                ConfigKitModule.forRoot({
                    env: testEnv,
                    configDir: resolve(import.meta.dirname, '../../../../config'),
                }),
                I18nKitModule,
                ServerKitModule.forRoot(),
                AiSearchTestModule,
            ],
        }).compile();
        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
        http = request(app.getHttpServer());
    });

    afterAll(async () => {
        await app?.close();
    });

    it('возвращает результат, сгруппированный по темам, с товарами и пояснением', async () => {
        const res = await http
            .post('/api/ai/search')
            .send({ query: 'хочу отремонтировать ванную комнату' });
        expect(res.status).toBe(201);
        expect(res.body.data.projectType).toBe('ремонт ванной');

        const themes = res.body.data.themes as Array<{
            name: string;
            explanation: string;
            products: Array<{ id: string }>;
        }>;
        expect(themes.length).toBe(2);

        const tile = themes.find((t) => t.name === 'Плитка');
        expect(tile?.explanation).toBeTruthy();
        // tileHit пришёл и из keyword, и из vector — должен быть один (дедуп по id).
        const ids = tile?.products.map((p) => p.id) ?? [];
        expect(ids).toContain('p-tile');
        expect(ids).toContain('p-glue');
        expect(ids.filter((id) => id === 'p-tile').length).toBe(1);
    });

    it('пустой запрос отклоняется валидацией (422)', async () => {
        const res = await http.post('/api/ai/search').send({ query: '' });
        expect(res.status).toBe(422);
    });
});
