import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { LoyaltyStore } from './loyalty.store';
import type { LoyaltyProgram, LoyaltyStatus } from './models';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

const STATUS: LoyaltyStatus = {
    metric: { totalSpend: 2000, totalOrders: 4 },
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
    toNext: 3000,
};

const PROGRAM: LoyaltyProgram = {
    basis: 'total_spend',
    tiers: [
        { level: 1, name: 'Bronze', threshold: 0, discountType: 'percent', discountValue: 5 },
        { level: 2, name: 'Silver', threshold: 5000, discountType: 'percent', discountValue: 10 },
    ],
};

describe('LoyaltyStore', () => {
    let store: LoyaltyStore;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        store = TestBed.inject(LoyaltyStore);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('load заполняет status и program', () => {
        store.load();
        httpMock.expectOne('http://api.test/api/loyalty/me').flush({ success: true, data: STATUS });
        httpMock
            .expectOne('http://api.test/api/loyalty/program')
            .flush({ success: true, data: PROGRAM });

        expect(store.status()).toEqual(STATUS);
        expect(store.tierName()).toBe('Bronze');
    });

    it('discountLabel считается из текущего уровня', () => {
        store.load();
        httpMock.expectOne('http://api.test/api/loyalty/me').flush({ success: true, data: STATUS });
        httpMock
            .expectOne('http://api.test/api/loyalty/program')
            .flush({ success: true, data: PROGRAM });

        expect(store.discountLabel()).toBe('5%');
    });

    it('progressPercent считается из toNext и порогов', () => {
        store.load();
        httpMock.expectOne('http://api.test/api/loyalty/me').flush({ success: true, data: STATUS });
        httpMock
            .expectOne('http://api.test/api/loyalty/program')
            .flush({ success: true, data: PROGRAM });

        // span = 5000-0 = 5000, done = 5000-3000 = 2000 → 40%
        expect(store.progressPercent()).toBe(40);
    });

    it('progressPercent = 100 когда нет nextTier', () => {
        const maxed: LoyaltyStatus = {
            metric: { totalSpend: 9000, totalOrders: 9 },
            currentTier: {
                level: 2,
                name: 'Silver',
                threshold: 5000,
                discountType: 'percent',
                discountValue: 10,
            },
        };
        store.load();
        httpMock.expectOne('http://api.test/api/loyalty/me').flush({ success: true, data: maxed });
        httpMock
            .expectOne('http://api.test/api/loyalty/program')
            .flush({ success: true, data: PROGRAM });

        expect(store.progressPercent()).toBe(100);
    });

    it('при ошибке status остаётся null (graceful)', () => {
        store.load();
        httpMock
            .expectOne('http://api.test/api/loyalty/me')
            .flush('fail', { status: 401, statusText: 'Unauthorized' });
        httpMock
            .expectOne('http://api.test/api/loyalty/program')
            .flush('fail', { status: 500, statusText: 'Error' });

        expect(store.status()).toBeNull();
        expect(store.program()).toBeNull();
        expect(store.tierName()).toBeNull();
        expect(store.discountLabel()).toBeNull();
        expect(store.progressPercent()).toBe(100);
    });
});
