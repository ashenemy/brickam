import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { LoyaltyComponent } from './loyalty.component';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

describe('LoyaltyComponent', () => {
    let fixture: ComponentFixture<LoyaltyComponent>;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [LoyaltyComponent],
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        fixture = TestBed.createComponent(LoyaltyComponent);
        httpMock = TestBed.inject(HttpTestingController);
        fixture.detectChanges();
        httpMock
            .expectOne('http://api.test/api/admin/loyalty/programs')
            .flush({ success: true, data: [] });
        fixture.detectChanges();
    });

    afterEach(() => httpMock.verify());

    it('«Создать» вызывает create API с basis и tiers', () => {
        const createBtn: HTMLButtonElement | null = fixture.nativeElement.querySelector(
            '[data-testid="create-btn"] button',
        );
        expect(createBtn).toBeTruthy();
        createBtn?.click();

        const req = httpMock.expectOne('http://api.test/api/admin/loyalty/programs');
        expect(req.request.method).toBe('POST');
        expect(req.request.body.basis).toBe('spend');
        expect(Array.isArray(req.request.body.tiers)).toBe(true);
        expect(req.request.body.tiers.length).toBe(1);
        req.flush({ success: true, data: { id: 'pr1', basis: 'spend', tiers: [] } });
    });
});
