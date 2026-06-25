import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { AiSearchPageComponent } from './ai-search-page.component';
import type { AiHit, AiSearchResult } from './models';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

function hit(id: string, slug: string): AiHit {
    return {
        id,
        slug,
        title: { hy: 'A', ru: `Товар ${id}`, en: `Item ${id}` },
        finalPrice: 4500,
        unit: 'pc',
        vendorId: 'v1',
        categoryId: 'c1',
        cover: { mediaType: 'image', url: `http://img/${id}.jpg` },
    };
}

function result(): AiSearchResult {
    return {
        projectType: 'Ремонт ванной',
        themes: [
            {
                name: 'Плитка',
                explanation: 'Облицовка стен',
                materialCategories: ['tile', 'glue'],
                keywords: ['плитка'],
                products: [hit('p1', 'cement'), hit('p2', 'tile')],
            },
            {
                name: 'Сантехника',
                explanation: 'Краны и трубы',
                materialCategories: ['plumbing'],
                keywords: ['кран'],
                products: [hit('p3', 'tap')],
            },
        ],
    };
}

describe('AiSearchPageComponent', () => {
    let fixture: ComponentFixture<AiSearchPageComponent>;
    let httpMock: HttpTestingController;
    let el: HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AiSearchPageComponent],
            providers: [
                provideRouter([]),
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AiSearchPageComponent);
        el = fixture.nativeElement as HTMLElement;
        fixture.detectChanges();
    });

    afterEach(() => httpMock?.verify());

    function submit(query: string): void {
        const ta = el.querySelector('[data-testid="ai-query"]') as HTMLTextAreaElement;
        ta.value = query;
        ta.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        const btn = el.querySelector('[data-testid="ai-search-btn"] button') as HTMLButtonElement;
        btn.click();
        fixture.detectChanges();
    }

    it('ввод + «Найти» вызывает api.search и рендерит projectType и аккордеоны тем', () => {
        httpMock = TestBed.inject(HttpTestingController);
        submit('ванная комната');

        const req = httpMock.expectOne('http://api.test/api/ai/search');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ query: 'ванная комната' });
        req.flush({ success: true, data: result() });
        fixture.detectChanges();

        const projectType = el.querySelector('[data-testid="ai-project-type"]');
        expect(projectType?.textContent).toContain('Ремонт ванной');

        const themes = el.querySelectorAll('[data-testid="ai-theme"]');
        expect(themes.length).toBe(2);
    });

    it('первый аккордеон раскрыт по умолчанию и показывает товары', () => {
        httpMock = TestBed.inject(HttpTestingController);
        submit('ванная');
        httpMock.expectOne('http://api.test/api/ai/search').flush({
            success: true,
            data: result(),
        });
        fixture.detectChanges();

        // Первая тема раскрыта -> её товары видны.
        const cards = el.querySelectorAll('bh-product-card');
        expect(cards.length).toBe(2);
    });

    it('раскрытие второй темы показывает её товары', () => {
        httpMock = TestBed.inject(HttpTestingController);
        submit('ванная');
        httpMock.expectOne('http://api.test/api/ai/search').flush({
            success: true,
            data: result(),
        });
        fixture.detectChanges();

        const headers = el.querySelectorAll('[data-testid="ai-theme"] > button');
        (headers[1] as HTMLButtonElement).click();
        fixture.detectChanges();

        // Теперь раскрыта вторая тема (1 товар), первая закрыта.
        const cards = el.querySelectorAll('bh-product-card');
        expect(cards.length).toBe(1);
    });

    it('пустой ответ → empty-состояние', () => {
        httpMock = TestBed.inject(HttpTestingController);
        submit('что-то');
        httpMock.expectOne('http://api.test/api/ai/search').flush({
            success: true,
            data: { projectType: 'X', themes: [] },
        });
        fixture.detectChanges();

        expect(el.querySelector('[data-testid="ai-empty"]')).toBeTruthy();
    });

    it('ошибка → error-состояние', () => {
        httpMock = TestBed.inject(HttpTestingController);
        submit('что-то');
        httpMock
            .expectOne('http://api.test/api/ai/search')
            .flush({ success: false }, { status: 500, statusText: 'Server Error' });
        fixture.detectChanges();

        expect(el.querySelector('[data-testid="ai-error"]')).toBeTruthy();
    });
});
