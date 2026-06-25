import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { AiSearchApiService } from './ai-search-api.service';
import type { AiSearchResult } from './models';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

describe('AiSearchApiService', () => {
    let service: AiSearchApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(AiSearchApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('search шлёт POST с body {query} на верный URL и парсит data', () => {
        let result: AiSearchResult | undefined;
        service.search('ванная комната').subscribe((res) => {
            result = res;
        });

        const req = httpMock.expectOne('http://api.test/api/ai/search');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ query: 'ванная комната' });

        req.flush({
            success: true,
            data: {
                projectType: 'Ремонт ванной',
                themes: [
                    {
                        name: 'Плитка',
                        explanation: 'Облицовка стен',
                        materialCategories: ['tile'],
                        keywords: ['плитка'],
                        products: [],
                    },
                ],
            },
        });

        expect(result?.projectType).toBe('Ремонт ванной');
        expect(result?.themes.length).toBe(1);
        expect(result?.themes[0].name).toBe('Плитка');
    });
});
