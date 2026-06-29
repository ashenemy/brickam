import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import type { Profile } from './models';
import { ProfileApiService } from './profile-api.service';

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

describe('ProfileApiService', () => {
    let service: ProfileApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(ProfileApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('me шлёт GET /users/me и парсит ответ', () => {
        let result: Profile | null = null;
        service.me().subscribe((d) => (result = d));
        const req = httpMock.expectOne('http://api.test/api/users/me');
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: PROFILE });
        expect(result).toEqual(PROFILE);
    });

    it('update шлёт PATCH /users/me с патчем', () => {
        let result: Profile | null = null;
        service.update({ name: 'Նոր', lang: 'ru' }).subscribe((d) => (result = d));
        const req = httpMock.expectOne('http://api.test/api/users/me');
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual({ name: 'Նոր', lang: 'ru' });
        const updated = { ...PROFILE, name: 'Նոր', lang: 'ru' };
        req.flush({ success: true, data: updated });
        expect(result).toEqual(updated);
    });

    it('changePassword шлёт POST /users/me/password', () => {
        let done = false;
        service
            .changePassword({ currentPassword: 'oldsecret1', newPassword: 'newsecret1' })
            .subscribe(() => (done = true));
        const req = httpMock.expectOne('http://api.test/api/users/me/password');
        expect(req.request.method).toBe('POST');
        req.flush({ success: true, data: null });
        expect(done).toBe(true);
    });
});
