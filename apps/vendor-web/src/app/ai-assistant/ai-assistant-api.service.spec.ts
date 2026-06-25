import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { AiAssistantApiService } from './ai-assistant-api.service';
import type { AiJob, CreateAiJobPayload } from './models';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

function mockJob(): AiJob {
    return { id: 'j1', type: 'description', status: 'queued', progress: 0 };
}

describe('AiAssistantApiService', () => {
    let service: AiAssistantApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(AiAssistantApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('create шлёт POST /ai-assistant/jobs с телом', () => {
        const payload: CreateAiJobPayload = {
            type: 'image',
            userPrompt: 'красивый цемент',
            productId: 'p1',
        };
        let result: AiJob | undefined;
        service.create(payload).subscribe((j) => (result = j));

        const req = httpMock.expectOne('http://api.test/api/ai-assistant/jobs');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(payload);
        req.flush({ success: true, data: { ...mockJob(), type: 'image' } });

        expect(result?.id).toBe('j1');
    });

    it('list шлёт GET /ai-assistant/jobs и парсит массив', () => {
        let result: AiJob[] | undefined;
        service.list().subscribe((items) => (result = items));

        const req = httpMock.expectOne('http://api.test/api/ai-assistant/jobs');
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: [mockJob()] });

        expect(result?.length).toBe(1);
        expect(result?.[0].id).toBe('j1');
    });

    it('get шлёт GET /ai-assistant/jobs/:id', () => {
        let result: AiJob | undefined;
        service.get('j1').subscribe((j) => (result = j));

        const req = httpMock.expectOne('http://api.test/api/ai-assistant/jobs/j1');
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: { ...mockJob(), status: 'processing', progress: 40 } });

        expect(result?.progress).toBe(40);
    });

    it('attach шлёт POST /ai-assistant/jobs/:id/attach', () => {
        service.attach('j1').subscribe();
        const req = httpMock.expectOne('http://api.test/api/ai-assistant/jobs/j1/attach');
        expect(req.request.method).toBe('POST');
        req.flush({ success: true, data: { ...mockJob(), status: 'done', progress: 100 } });
    });
});
