import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { LanguageService } from '@brickam/i18n-kit/browser';
import type { Profile } from './models';
import { ProfileStore } from './profile.store';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

const PROFILE: Profile = {
    id: 'u1',
    role: 'buyer',
    accountType: 'individual',
    name: 'Արամ',
    phone: '+37499000000',
    phoneVerified: true,
    lang: 'hy',
    status: 'active',
};

describe('ProfileStore', () => {
    let store: ProfileStore;
    let httpMock: HttpTestingController;
    let i18n: LanguageService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        store = TestBed.inject(ProfileStore);
        httpMock = TestBed.inject(HttpTestingController);
        i18n = TestBed.inject(LanguageService);
    });

    afterEach(() => httpMock.verify());

    it('load заполняет profile', () => {
        store.load();
        httpMock.expectOne('http://api.test/api/users/me').flush({ success: true, data: PROFILE });
        expect(store.profile()).toEqual(PROFILE);
        expect(store.loading()).toBe(false);
    });

    it('load: при ошибке profile остаётся null (graceful)', () => {
        store.load();
        httpMock
            .expectOne('http://api.test/api/users/me')
            .flush('fail', { status: 401, statusText: 'Unauthorized' });
        expect(store.profile()).toBeNull();
        expect(store.loading()).toBe(false);
    });

    it('save обновляет профиль, поднимает saved и применяет язык', () => {
        store.save({ name: 'Նոր', lang: 'ru' });
        const req = httpMock.expectOne('http://api.test/api/users/me');
        expect(req.request.method).toBe('PATCH');
        req.flush({ success: true, data: { ...PROFILE, name: 'Նոր', lang: 'ru' } });
        expect(store.profile()?.name).toBe('Նոր');
        expect(store.saved()).toBe(true);
        expect(i18n.lang()).toBe('ru');
    });

    it('save: при ошибке поднимает error', () => {
        store.save({ name: 'X' });
        httpMock
            .expectOne('http://api.test/api/users/me')
            .flush('fail', { status: 500, statusText: 'Error' });
        expect(store.error()).toBe(true);
        expect(store.saving()).toBe(false);
    });

    it('changePassword вызывает onDone(true) при успехе', () => {
        let ok: boolean | null = null;
        store.changePassword(
            { currentPassword: 'oldsecret1', newPassword: 'newsecret1' },
            (r) => (ok = r),
        );
        httpMock.expectOne('http://api.test/api/users/me/password').flush({ success: true });
        expect(ok).toBe(true);
    });

    it('changePassword вызывает onDone(false) при ошибке', () => {
        let ok: boolean | null = null;
        store.changePassword(
            { currentPassword: 'bad', newPassword: 'newsecret1' },
            (r) => (ok = r),
        );
        httpMock
            .expectOne('http://api.test/api/users/me/password')
            .flush('fail', { status: 401, statusText: 'Unauthorized' });
        expect(ok).toBe(false);
    });
});
