import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { of } from 'rxjs';
import { SeoService } from '../seo/seo.service';
import type { CmsPage } from './models';
import { PageViewComponent } from './page-view.component';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

// LanguageService по умолчанию hy (DEFAULT_LANG) — заполняем hy осмысленно.
function page(): CmsPage {
    return {
        slug: 'about',
        title: { hy: 'Մեր մասին', ru: 'О компании', en: 'About' },
        content: { hy: 'Տեքստ ընկերության մասին', ru: 'Текст', en: 'Text' },
        seoTitle: { hy: 'SEO վերնագիր', ru: 'SEO заголовок', en: 'SEO title' },
        seoDescription: { hy: 'SEO նկարագրություն', ru: 'SEO описание', en: 'SEO desc' },
    };
}

async function setup(): Promise<{
    fixture: ComponentFixture<PageViewComponent>;
    httpMock: HttpTestingController;
    seoSet: ReturnType<typeof vi.fn>;
}> {
    const seoSet = vi.fn();
    await TestBed.configureTestingModule({
        imports: [PageViewComponent],
        providers: [
            provideRouter([]),
            provideHttpClient(withFetch()),
            provideHttpClientTesting(),
            { provide: RUNTIME_CONFIG, useValue: CONFIG },
            { provide: SeoService, useValue: { set: seoSet } },
            {
                provide: ActivatedRoute,
                useValue: { paramMap: of(convertToParamMap({ slug: 'about' })) },
            },
        ],
    }).compileComponents();

    // Язык фиксируем явно (en) — спека проверяет английские значения и не должна
    // зависеть от localStorage, который могли «загрязнить» другие спеки (setLang).
    TestBed.inject(LanguageService).setLang('en');
    const fixture = TestBed.createComponent(PageViewComponent);
    const httpMock = TestBed.inject(HttpTestingController);
    return { fixture, httpMock, seoSet };
}

describe('PageViewComponent', () => {
    it('рендерит заголовок и контент страницы', async () => {
        const { fixture, httpMock } = await setup();
        fixture.detectChanges();

        const req = httpMock.expectOne('http://api.test/api/pages/about');
        req.flush({ success: true, data: page() });
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('h1')?.textContent).toContain('About');
        expect(el.querySelector('[data-testid="page-content"]')?.textContent).toContain('Text');
        httpMock.verify();
    });

    it('вызывает seo.set из seoTitle/seoDescription', async () => {
        const { fixture, httpMock, seoSet } = await setup();
        fixture.detectChanges();

        const req = httpMock.expectOne('http://api.test/api/pages/about');
        req.flush({ success: true, data: page() });
        fixture.detectChanges();

        expect(seoSet).toHaveBeenCalled();
        const arg = seoSet.mock.calls.at(-1)?.[0];
        expect(arg.title).toBe('SEO title');
        expect(arg.description).toBe('SEO desc');
        httpMock.verify();
    });

    it('показывает 404-состояние при ошибке', async () => {
        const { fixture, httpMock } = await setup();
        fixture.detectChanges();

        const req = httpMock.expectOne('http://api.test/api/pages/about');
        req.flush({ message: 'not found' }, { status: 404, statusText: 'Not Found' });
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('[data-testid="page-not-found"]')).toBeTruthy();
        expect(el.querySelector('[data-testid="page-content"]')).toBeFalsy();
        httpMock.verify();
    });
});
