import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { LoyaltyApiService } from './loyalty-api.service';
import type { LoyaltyProgram, LoyaltyStatus } from './models';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

const STATUS: LoyaltyStatus = {
    metric: { totalSpend: 1000, totalOrders: 3 },
    currentTier: {
        level: 1,
        name: 'Bronze',
        threshold: 0,
        discountType: 'percent',
        discountValue: 5,
    },
    nextTier: {
        level: 2,
        name: 'Silver',
        threshold: 5000,
        discountType: 'percent',
        discountValue: 10,
    },
    toNext: 4000,
};

const PROGRAM: LoyaltyProgram = {
    basis: 'total_spend',
    tiers: [
        { level: 1, name: 'Bronze', threshold: 0, discountType: 'percent', discountValue: 5 },
        { level: 2, name: 'Silver', threshold: 5000, discountType: 'percent', discountValue: 10 },
    ],
};

describe('LoyaltyApiService', () => {
    let service: LoyaltyApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(LoyaltyApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('me шлёт GET /loyalty/me и парсит ответ', () => {
        let result: LoyaltyStatus | null = null;
        service.me().subscribe((d) => (result = d));
        const req = httpMock.expectOne('http://api.test/api/loyalty/me');
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: STATUS });
        expect(result).toEqual(STATUS);
    });

    it('program шлёт GET /loyalty/program и парсит ответ', () => {
        let result: LoyaltyProgram | null = null;
        service.program().subscribe((d) => (result = d));
        const req = httpMock.expectOne('http://api.test/api/loyalty/program');
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: PROGRAM });
        expect(result).toEqual(PROGRAM);
    });
});
