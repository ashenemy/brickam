import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { TemplatesApiService } from './templates-api.service';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

describe('TemplatesApiService', () => {
    let service: TemplatesApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(TemplatesApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('list шлёт GET /admin/templates', () => {
        service.list().subscribe();
        const req = httpMock.expectOne('http://api.test/api/admin/templates');
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: [] });
    });

    it('update шлёт PUT /admin/templates/:key с телом', () => {
        const payload = {
            content: { hy: 'a', ru: 'б', en: 'c' },
            variables: ['name'],
            subject: 'Hi',
        };
        service.update('welcome', payload).subscribe();
        const req = httpMock.expectOne('http://api.test/api/admin/templates/welcome');
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(payload);
        req.flush({ success: true, data: { key: 'welcome', ...payload } });
    });

    it('preview шлёт POST /admin/templates/:key/preview с lang и vars', () => {
        service.preview('welcome', 'ru', { name: 'Иван' }).subscribe();
        const req = httpMock.expectOne('http://api.test/api/admin/templates/welcome/preview');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ lang: 'ru', vars: { name: 'Иван' } });
        req.flush({ success: true, data: { rendered: 'Привет, Иван' } });
    });
});
