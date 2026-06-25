import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { MembersComponent } from './members.component';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

/** Доступ к protected-членам компонента. */
type Probe = {
    phone: { set(v: string): void };
    add(): void;
};

describe('MembersComponent', () => {
    let fixture: ComponentFixture<MembersComponent>;
    let probe: Probe;
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MembersComponent],
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MembersComponent);
        probe = fixture.componentInstance as unknown as Probe;
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('рендерит список членов команды', () => {
        const listReq = httpMock.expectOne('http://api.test/api/vendor-members');
        listReq.flush({
            success: true,
            data: [
                {
                    id: 'm1',
                    vendorId: 'v1',
                    userId: 'u1',
                    role: 'vendor_member',
                    permissions: ['orders.view'],
                },
            ],
        });
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        expect(el.textContent).toContain('u1');
        expect(el.textContent).toContain('orders.view');
    });

    it('добавление вызывает POST с phone и permissions', () => {
        httpMock.expectOne('http://api.test/api/vendor-members').flush({ success: true, data: [] });
        fixture.detectChanges();

        probe.phone.set('+37411223344');
        probe.add();

        const req = httpMock.expectOne(
            (r) => r.url === 'http://api.test/api/vendor-members' && r.method === 'POST',
        );
        expect(req.request.body.phone).toBe('+37411223344');
        expect(Array.isArray(req.request.body.permissions)).toBe(true);
        expect(req.request.body.permissions).toContain('orders.view');
        req.flush({
            success: true,
            data: {
                id: 'm2',
                vendorId: 'v1',
                userId: 'u2',
                role: 'vendor_member',
                permissions: ['orders.view'],
            },
        });
    });
});
