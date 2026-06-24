import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import type { ProductListItem } from '../catalog/models';
import { WishlistPageComponent } from './wishlist-page.component';

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

describe('WishlistPageComponent', () => {
    let fixture: ComponentFixture<WishlistPageComponent>;
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WishlistPageComponent],
            providers: [
                provideRouter([]),
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(WishlistPageComponent);
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

    it('рендерит карточки из мок by-ids', () => {
        fixture.detectChanges();

        // load() -> GET /wishlist
        httpMock.expectOne('http://api.test/api/wishlist').flush({
            success: true,
            data: { items: [{ productId: 'p1', addedAt: 'x' }], count: 1 },
        });
        fixture.detectChanges();

        // effect -> GET by-ids
        const byIds = httpMock.expectOne(
            (r) => r.url === 'http://api.test/api/catalog/products/by-ids',
        );
        expect(byIds.request.params.get('ids')).toBe('p1');
        byIds.flush({ success: true, data: [item('p1', 'cement')] });
        fixture.detectChanges();

        const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('bh-product-card');
        expect(cards.length).toBe(1);
    });

    it('«в корзину» шлёт POST /cart/items и убирает из вишлиста', () => {
        fixture.detectChanges();
        httpMock.expectOne('http://api.test/api/wishlist').flush({
            success: true,
            data: { items: [{ productId: 'p1', addedAt: 'x' }], count: 1 },
        });
        fixture.detectChanges();
        httpMock
            .expectOne((r) => r.url === 'http://api.test/api/catalog/products/by-ids')
            .flush({ success: true, data: [item('p1', 'cement')] });
        fixture.detectChanges();

        (fixture.componentInstance as unknown as { addToCart(id: string): void }).addToCart('p1');

        const cart = httpMock.expectOne('http://api.test/api/cart/items');
        expect(cart.request.method).toBe('POST');
        expect(cart.request.body).toEqual({ productId: 'p1', qty: 1 });
        cart.flush({ success: true, data: {} });

        // remove -> DELETE
        const del = httpMock.expectOne('http://api.test/api/wishlist/items/p1');
        expect(del.request.method).toBe('DELETE');
        del.flush({ success: true, data: { items: [], count: 0 } });
    });
});
