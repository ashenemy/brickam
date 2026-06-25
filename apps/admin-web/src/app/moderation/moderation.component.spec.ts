import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { ModerationComponent } from './moderation.component';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

describe('ModerationComponent', () => {
    let fixture: ComponentFixture<ModerationComponent>;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ModerationComponent],
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        fixture = TestBed.createComponent(ModerationComponent);
        httpMock = TestBed.inject(HttpTestingController);
        fixture.detectChanges();
        flushInitial();
    });

    afterEach(() => httpMock.verify());

    function flushInitial(): void {
        httpMock
            .expectOne((r) => r.url === 'http://api.test/api/admin/vendors')
            .flush({ success: true, data: [{ id: 'v1', name: 'Acme', status: 'pending' }] });
        httpMock
            .expectOne((r) => r.url === 'http://api.test/api/admin/products')
            .flush({ success: true, data: [] });
    }

    it('approve вендора вызывает moderate API с action=approve', () => {
        fixture.detectChanges();
        const btn = fixture.nativeElement.querySelector('bh-button[variant="primary"] button');
        btn.click();
        const req = httpMock.expectOne('http://api.test/api/admin/vendors/v1/moderate');
        expect(req.request.body).toEqual({ action: 'approve' });
        req.flush({ success: true, data: { id: 'v1', name: 'Acme', status: 'active' } });
    });
});
