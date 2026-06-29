import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import type { Profile } from './models';
import { ProfilePageComponent } from './profile-page.component';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

const PROFILE: Profile = {
    id: 'u1',
    role: 'buyer',
    accountType: 'individual',
    name: 'Արամ Պետրոսյան',
    phone: '+37499000000',
    phoneVerified: true,
    lang: 'hy',
    status: 'active',
};

describe('ProfilePageComponent', () => {
    let fixture: ComponentFixture<ProfilePageComponent>;
    let httpMock: HttpTestingController;
    let el: HTMLElement;

    function init(profile: Profile | null = PROFILE) {
        fixture.detectChanges();
        const req = httpMock.expectOne('http://api.test/api/users/me');
        if (profile) {
            req.flush({ success: true, data: profile });
        } else {
            req.flush('fail', { status: 401, statusText: 'Unauthorized' });
        }
        fixture.detectChanges();
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ProfilePageComponent],
            providers: [
                provideRouter([]),
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ProfilePageComponent);
        httpMock = TestBed.inject(HttpTestingController);
        el = fixture.nativeElement as HTMLElement;
    });

    afterEach(() => httpMock.verify());

    it('рендерит имя и телефон из профиля', () => {
        init();
        expect(el.textContent).toContain('Արամ Պետրոսյան');
        expect(el.textContent).toContain('+37499000000');
    });

    it('сохранение шлёт PATCH и показывает saved', () => {
        init();
        const buttons = el.querySelectorAll('bh-button');
        // Первая «primary»-кнопка — Save личных данных.
        (buttons[1].querySelector('button') as HTMLButtonElement).click();
        const req = httpMock.expectOne('http://api.test/api/users/me');
        expect(req.request.method).toBe('PATCH');
        req.flush({ success: true, data: PROFILE });
        fixture.detectChanges();
        expect(el.querySelector('[data-testid="profile-saved"]')).toBeTruthy();
    });

    it('рендерит ссылки на разделы аккаунта', () => {
        init();
        expect(el.querySelector('a[href="/orders"]')).toBeTruthy();
        expect(el.querySelector('a[href="/loyalty"]')).toBeTruthy();
    });
});
