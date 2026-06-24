import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { CatalogApiService } from './catalog-api.service';
import type { ApiListResponse, ProductListItem } from './models';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

function mockItem(): ProductListItem {
    return {
        id: 'p1',
        slug: 'cement-m500',
        vendorId: 'v1',
        categoryId: 'c1',
        title: { hy: 'Ցեմենտ', ru: 'Цемент', en: 'Cement' },
        cover: { mediaType: 'image', url: 'http://img/c.jpg' },
        price: 5000,
        finalPrice: 4500,
        discount: 10,
        unit: 'bag',
        stock: 12,
        region: 'yerevan',
        ratingAvg: 4.5,
        ratingCount: 8,
    };
}

describe('CatalogApiService', () => {
    let service: CatalogApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(CatalogApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('getProducts собирает корректные query-параметры и парсит ответ', () => {
        let result: { data: ProductListItem[]; total: number } | undefined;
        service
            .getProducts({
                page: 2,
                pageSize: 12,
                q: 'cement',
                categoryId: 'c1',
                minPrice: 1000,
                maxPrice: 9000,
                sort: 'price_asc',
            })
            .subscribe((res) => {
                result = { data: res.data, total: res.meta.total };
            });

        const req = httpMock.expectOne((r) => r.url === 'http://api.test/api/catalog/products');
        expect(req.request.method).toBe('GET');
        const p = req.request.params;
        expect(p.get('page')).toBe('2');
        expect(p.get('pageSize')).toBe('12');
        expect(p.get('q')).toBe('cement');
        expect(p.get('categoryId')).toBe('c1');
        expect(p.get('minPrice')).toBe('1000');
        expect(p.get('maxPrice')).toBe('9000');
        expect(p.get('sort')).toBe('price_asc');

        const body: ApiListResponse<ProductListItem> = {
            success: true,
            data: [mockItem()],
            meta: {
                page: 2,
                pageSize: 12,
                total: 13,
                totalPages: 2,
                hasNext: false,
                hasPrev: true,
            },
        };
        req.flush(body);

        expect(result?.data.length).toBe(1);
        expect(result?.data[0].slug).toBe('cement-m500');
        expect(result?.total).toBe(13);
    });

    it('getProducts опускает пустые параметры', () => {
        service.getProducts({ page: 1 }).subscribe();
        const req = httpMock.expectOne((r) => r.url === 'http://api.test/api/catalog/products');
        expect(req.request.params.get('page')).toBe('1');
        expect(req.request.params.has('q')).toBe(false);
        expect(req.request.params.has('categoryId')).toBe(false);
        req.flush({
            success: true,
            data: [],
            meta: {
                page: 1,
                pageSize: 12,
                total: 0,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
            },
        });
    });

    it('getProduct грузит по slug', () => {
        service.getProduct('cement-m500').subscribe();
        const req = httpMock.expectOne('http://api.test/api/catalog/products/cement-m500');
        expect(req.request.method).toBe('GET');
        req.flush({
            success: true,
            data: {
                ...mockItem(),
                description: { hy: '', ru: '', en: '' },
                gallery: [],
                attributes: [],
                status: 'active',
                viewsCount: 0,
            },
        });
    });

    it('getCategories возвращает массив категорий', () => {
        let count = -1;
        service.getCategories().subscribe((c) => (count = c.length));
        const req = httpMock.expectOne('http://api.test/api/catalog/categories');
        req.flush({
            success: true,
            data: [{ id: 'c1', slug: 'cement', name: { hy: '', ru: '', en: '' }, order: 1 }],
        });
        expect(count).toBe(1);
    });
});
