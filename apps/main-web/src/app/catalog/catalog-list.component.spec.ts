import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { CatalogListComponent } from './catalog-list.component';
import type { ApiListResponse, Category, PageMeta, ProductListItem } from './models';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

function item(id: string, slug: string): ProductListItem {
    return {
        id,
        slug,
        vendorId: 'v1',
        categoryId: 'c1',
        title: { hy: 'A', ru: `Товар ${id}`, en: `Item ${id}` },
        cover: { mediaType: 'image', url: `http://img/${id}.jpg` },
        price: 100,
        finalPrice: 100,
        unit: 'pc',
        stock: 5,
        region: 'yerevan',
        ratingAvg: 4,
        ratingCount: 2,
    };
}

function meta(over: Partial<PageMeta> = {}): PageMeta {
    return {
        page: 1,
        pageSize: 12,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
        ...over,
    };
}

function listBody(items: ProductListItem[], m: PageMeta): ApiListResponse<ProductListItem> {
    return { success: true, data: items, meta: m };
}

describe('CatalogListComponent', () => {
    let fixture: ComponentFixture<CatalogListComponent>;
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CatalogListComponent],
            providers: [
                provideRouter([]),
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CatalogListComponent);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        // Подчищаем возможные хвостовые запросы категорий.
        for (const r of httpMock.match(() => true)) {
            if (!r.cancelled) {
                r.flush({ success: true, data: [] });
            }
        }
        httpMock.verify();
    });

    function flushCategories(): void {
        const req = httpMock.expectOne('http://api.test/api/catalog/categories');
        req.flush({ success: true, data: [] });
    }

    it('рендерит N карточек из мок-ответа', () => {
        fixture.detectChanges();
        flushCategories();

        const req = httpMock.expectOne((r) => r.url === 'http://api.test/api/catalog/products');
        req.flush(listBody([item('1', 'a'), item('2', 'b'), item('3', 'c')], meta({ total: 3 })));
        fixture.detectChanges();

        const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('bh-product-card');
        expect(cards.length).toBe(3);
    });

    it('смена страницы шлёт новый запрос с page=2', () => {
        fixture.detectChanges();
        flushCategories();

        const first = httpMock.expectOne((r) => r.url === 'http://api.test/api/catalog/products');
        expect(first.request.params.get('page')).toBe('1');
        first.flush(listBody([item('1', 'a')], meta({ hasNext: true, totalPages: 2 })));
        fixture.detectChanges();

        // Переход на следующую страницу
        (fixture.componentInstance as unknown as { nextPage(): void }).nextPage();
        fixture.detectChanges();

        const second = httpMock.expectOne((r) => r.url === 'http://api.test/api/catalog/products');
        expect(second.request.params.get('page')).toBe('2');
        second.flush(listBody([item('2', 'b')], meta({ page: 2, hasPrev: true })));
    });

    it('смена фильтра поиска перезапрашивает с q', () => {
        fixture.detectChanges();
        flushCategories();

        const first = httpMock.expectOne((r) => r.url === 'http://api.test/api/catalog/products');
        first.flush(listBody([item('1', 'a')], meta()));
        fixture.detectChanges();

        (fixture.componentInstance as unknown as { q: { set(v: string): void } }).q.set('cement');
        fixture.detectChanges();

        const second = httpMock.expectOne((r) => r.url === 'http://api.test/api/catalog/products');
        expect(second.request.params.get('q')).toBe('cement');
        second.flush(listBody([], meta({ total: 0 })));
    });
});

function category(id: string, slug: string): Category {
    return { id, slug, name: { hy: slug, ru: slug, en: slug }, order: 0 };
}

describe('CatalogListComponent — предвыбор категории из query', () => {
    let fixture: ComponentFixture<CatalogListComponent>;
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CatalogListComponent],
            providers: [
                provideRouter([]),
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: { queryParamMap: convertToParamMap({ category: 'paint' }) },
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CatalogListComponent);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        for (const r of httpMock.match(() => true)) {
            if (!r.cancelled) {
                r.flush({ success: true, data: [] });
            }
        }
        httpMock.verify();
    });

    it('при query category=<slug> предвыбирает соответствующую категорию по slug', () => {
        fixture.detectChanges();

        // Категории приходят асинхронно; отдаём список со slug 'paint'.
        const catReq = httpMock.expectOne('http://api.test/api/catalog/categories');
        catReq.flush({
            success: true,
            data: [category('c-paint', 'paint'), category('c-tile', 'tile')],
        });
        fixture.detectChanges();

        // После выбора категории идёт запрос товаров с categoryId предвыбранной категории.
        const prodReqs = httpMock.match((r) => r.url === 'http://api.test/api/catalog/products');
        const last = prodReqs[prodReqs.length - 1];
        expect(last.request.params.get('categoryId')).toBe('c-paint');
        last.flush(listBody([], meta({ total: 0 })));

        expect(
            (
                fixture.componentInstance as unknown as { categoryId(): string | undefined }
            ).categoryId(),
        ).toBe('c-paint');
    });
});
