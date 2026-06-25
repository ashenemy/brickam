import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import type { CreateProductPayload, ProductListItem } from './models';
import { ProductsApiService } from './products-api.service';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

function mockItem(): ProductListItem {
    return {
        id: 'p1',
        slug: 'cement',
        vendorId: 'v1',
        categoryId: 'c1',
        title: { ru: 'Цемент', hy: '', en: 'Cement' },
        cover: { mediaType: 'image', url: 'http://x/img.jpg' },
        price: 5000,
        finalPrice: 5000,
        unit: 'pcs',
        stock: 10,
        region: 'Yerevan',
        ratingAvg: 0,
        ratingCount: 0,
    };
}

describe('ProductsApiService', () => {
    let service: ProductsApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(ProductsApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('list шлёт GET /catalog/products с vendorId и парсит массив data', () => {
        let result: ProductListItem[] | undefined;
        service.list('v1').subscribe((items) => (result = items));

        const req = httpMock.expectOne(
            (r) =>
                r.url === 'http://api.test/api/catalog/products' &&
                r.params.get('vendorId') === 'v1',
        );
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: [mockItem()] });

        expect(result?.length).toBe(1);
        expect(result?.[0].id).toBe('p1');
    });

    it('create шлёт POST /catalog/products с телом', () => {
        const payload: CreateProductPayload = {
            vendorId: 'v1',
            categoryId: 'c1',
            slug: 'cement',
            title: { ru: 'Цемент', hy: '', en: 'Cement' },
            description: { ru: '', hy: '', en: '' },
            cover: { mediaType: 'image', url: 'http://x/img.jpg' },
            price: 5000,
            unit: 'pcs',
            region: 'Yerevan',
        };
        service.create(payload).subscribe();

        const req = httpMock.expectOne('http://api.test/api/catalog/products');
        expect(req.request.method).toBe('POST');
        expect(req.request.body.slug).toBe('cement');
        req.flush({
            success: true,
            data: {
                ...mockItem(),
                description: { ru: '', hy: '', en: '' },
                gallery: [],
                status: 'active',
            },
        });
    });

    it('hide шлёт PATCH со status=hidden', () => {
        service.hide('p1').subscribe();
        const req = httpMock.expectOne('http://api.test/api/catalog/products/p1');
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual({ status: 'hidden' });
        req.flush({ success: true, data: {} });
    });

    it('remove шлёт DELETE /catalog/products/:id', () => {
        service.remove('p1').subscribe();
        const req = httpMock.expectOne('http://api.test/api/catalog/products/p1');
        expect(req.request.method).toBe('DELETE');
        req.flush({ success: true, data: { id: 'p1' } });
    });
});
