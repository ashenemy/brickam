import { HttpClient, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authInterceptor } from './auth.interceptor';
import { TokenStore } from './token.store';

describe('authInterceptor', () => {
    let http: HttpClient;
    let httpMock: HttpTestingController;
    let store: TokenStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
                provideHttpClientTesting(),
            ],
        });
        http = TestBed.inject(HttpClient);
        httpMock = TestBed.inject(HttpTestingController);
        store = TestBed.inject(TokenStore);
    });

    afterEach(() => httpMock.verify());

    it('всегда ставит withCredentials и добавляет Bearer когда токен есть', () => {
        store.set('abc123');
        http.get('/x').subscribe();
        const req = httpMock.expectOne('/x');
        expect(req.request.withCredentials).toBe(true);
        expect(req.request.headers.get('Authorization')).toBe('Bearer abc123');
        req.flush({});
        store.clear();
    });

    it('ставит withCredentials, но не добавляет Authorization когда токена нет', () => {
        store.clear();
        http.get('/x').subscribe();
        const req = httpMock.expectOne('/x');
        expect(req.request.withCredentials).toBe(true);
        expect(req.request.headers.has('Authorization')).toBe(false);
        req.flush({});
    });
});
