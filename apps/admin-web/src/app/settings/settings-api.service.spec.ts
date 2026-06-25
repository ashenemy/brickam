import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { type DefaultSettings, SettingsApiService } from './settings-api.service';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

describe('SettingsApiService', () => {
    let service: SettingsApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(SettingsApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('get шлёт GET /admin/settings/:key и возвращает value', () => {
        let result: DefaultSettings | undefined;
        service.get<DefaultSettings>('default').subscribe((v) => (result = v));
        const req = httpMock.expectOne('http://api.test/api/admin/settings/default');
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: { value: { commissionPercent: 5 } } });
        expect(result?.commissionPercent).toBe(5);
    });

    it('put шлёт PUT /admin/settings/:key с {value}', () => {
        service.put<DefaultSettings>('default', { commissionPercent: 7 }).subscribe();
        const req = httpMock.expectOne('http://api.test/api/admin/settings/default');
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ value: { commissionPercent: 7 } });
        req.flush({ success: true, data: { value: { commissionPercent: 7 } } });
    });
});
