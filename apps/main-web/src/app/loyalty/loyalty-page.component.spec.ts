import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { LoyaltyPageComponent } from './loyalty-page.component';
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

describe('LoyaltyPageComponent', () => {
    let fixture: ComponentFixture<LoyaltyPageComponent>;
    let httpMock: HttpTestingController;
    let el: HTMLElement;

    function flush(
        status: LoyaltyStatus | null = STATUS,
        program: LoyaltyProgram | null = PROGRAM,
    ) {
        fixture.detectChanges();
        const me = httpMock.expectOne('http://api.test/api/loyalty/me');
        if (status) {
            me.flush({ success: true, data: status });
        } else {
            me.flush('fail', { status: 401, statusText: 'Unauthorized' });
        }
        const prog = httpMock.expectOne('http://api.test/api/loyalty/program');
        if (program) {
            prog.flush({ success: true, data: program });
        } else {
            prog.flush('fail', { status: 500, statusText: 'Error' });
        }
        fixture.detectChanges();
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoyaltyPageComponent],
            providers: [
                provideRouter([]),
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(LoyaltyPageComponent);
        httpMock = TestBed.inject(HttpTestingController);
        el = fixture.nativeElement as HTMLElement;
    });

    afterEach(() => httpMock.verify());

    it('рендерит уровень, метрику и скидку из статуса', () => {
        flush();
        expect(el.querySelector('[data-testid="loyalty-current-tier"]')?.textContent).toContain(
            'Bronze',
        );
        expect(el.querySelector('[data-testid="loyalty-metric"]')?.textContent).toContain('2');
        expect(el.querySelector('[data-testid="loyalty-discount"]')?.textContent).toContain('5%');
    });

    it('прогресс-бар отражает toNext (40%)', () => {
        flush();
        const fill = el.querySelector('[data-testid="loyalty-progress-fill"]') as HTMLElement;
        expect(fill).toBeTruthy();
        expect(fill.style.width).toBe('40%');
        const bar = el.querySelector('[data-testid="loyalty-progress"]') as HTMLElement;
        expect(bar.getAttribute('aria-valuenow')).toBe('40');
    });

    it('список уровней подсвечивает текущий', () => {
        flush();
        const items = el.querySelectorAll('[data-testid="loyalty-tiers"] li');
        expect(items.length).toBe(2);
        const current = el.querySelectorAll(
            '[data-testid="loyalty-tiers"] li[data-current="true"]',
        );
        expect(current.length).toBe(1);
        expect(current[0].textContent).toContain('Bronze');
    });

    it('пустое состояние при отсутствии статуса', () => {
        flush(null, PROGRAM);
        expect(el.querySelector('[data-testid="loyalty-empty"]')).toBeTruthy();
        expect(el.querySelector('[data-testid="loyalty-card"]')).toBeNull();
    });
});
