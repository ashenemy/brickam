import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import type { CmsPage, CmsPageListItem } from './models';
import { PagesApiService } from './pages-api.service';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

function mockPage(): CmsPage {
    return {
        slug: 'about',
        title: { hy: 'Մեր մասին', ru: 'О нас', en: 'About' },
        content: { hy: '...', ru: 'Текст', en: 'Text' },
        seoTitle: { hy: '', ru: 'SEO О нас', en: 'SEO About' },
        seoDescription: { hy: '', ru: 'Описание', en: 'Description' },
    };
}

describe('PagesApiService', () => {
    let service: PagesApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(PagesApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('getBySlug грузит страницу по slug и распаковывает data', () => {
        let result: CmsPage | undefined;
        service.getBySlug('about').subscribe((p) => (result = p));

        const req = httpMock.expectOne('http://api.test/api/pages/about');
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: mockPage() });

        expect(result?.slug).toBe('about');
        expect(result?.title.ru).toBe('О нас');
    });

    it('getBySlug кодирует slug', () => {
        service.getBySlug('a b').subscribe();
        const req = httpMock.expectOne('http://api.test/api/pages/a%20b');
        req.flush({ success: true, data: mockPage() });
    });

    it('list возвращает массив страниц', () => {
        let result: CmsPageListItem[] | undefined;
        service.list().subscribe((list) => (result = list));

        const req = httpMock.expectOne('http://api.test/api/pages');
        expect(req.request.method).toBe('GET');
        req.flush({
            success: true,
            data: [{ slug: 'about', title: { hy: '', ru: 'О нас', en: 'About' } }],
        });

        expect(result?.length).toBe(1);
        expect(result?.[0].slug).toBe('about');
    });
});
