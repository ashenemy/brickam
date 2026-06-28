import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { of } from 'rxjs';
import { SeoService } from '../seo/seo.service';
import type { MediaType, ProductDetail } from './models';
import { ProductDetailComponent } from './product-detail.component';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

function detail(coverType: MediaType, thumbnailUrl?: string): ProductDetail {
    const cover: ProductDetail['cover'] = {
        mediaType: coverType,
        url: `http://media/cover.${coverType === 'video' ? 'mp4' : 'jpg'}`,
    };
    if (thumbnailUrl) {
        cover.thumbnailUrl = thumbnailUrl;
    }
    return {
        id: 'p1',
        slug: 'item-1',
        vendorId: 'v1',
        categoryId: 'c1',
        title: { hy: 'A', ru: 'Товар', en: 'Item' },
        cover,
        price: 100,
        finalPrice: 100,
        unit: 'pc',
        stock: 5,
        region: 'yerevan',
        ratingAvg: 4,
        ratingCount: 2,
        description: { hy: '', ru: 'Описание', en: 'Desc' },
        gallery: [],
        attributes: [{ key: 'Weight', value: '50kg' }],
        status: 'active',
        viewsCount: 10,
    };
}

async function setup(): Promise<{
    fixture: ComponentFixture<ProductDetailComponent>;
    httpMock: HttpTestingController;
    seoSet: ReturnType<typeof vi.fn>;
}> {
    const seoSet = vi.fn();
    await TestBed.configureTestingModule({
        imports: [ProductDetailComponent],
        providers: [
            provideRouter([]),
            provideHttpClient(withFetch()),
            provideHttpClientTesting(),
            { provide: RUNTIME_CONFIG, useValue: CONFIG },
            { provide: SeoService, useValue: { set: seoSet } },
            {
                provide: ActivatedRoute,
                useValue: { paramMap: of(convertToParamMap({ slug: 'item-1' })) },
            },
        ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProductDetailComponent);
    const httpMock = TestBed.inject(HttpTestingController);
    return { fixture, httpMock, seoSet };
}

describe('ProductDetailComponent', () => {
    it('видео-обложка рендерит <video> с poster=thumbnailUrl', async () => {
        const { fixture, httpMock } = await setup();
        fixture.detectChanges();

        const req = httpMock.expectOne('http://api.test/api/catalog/products/item-1');
        req.flush({ success: true, data: detail('video', 'http://media/poster.jpg') });
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        const video = el.querySelector('video');
        expect(video).toBeTruthy();
        expect(video?.getAttribute('poster')).toBe('http://media/poster.jpg');
        expect(el.querySelector('video source')?.getAttribute('src')).toBe(
            'http://media/cover.mp4',
        );
        httpMock.verify();
    });

    it('фото-обложка рендерит <img> (без video)', async () => {
        const { fixture, httpMock } = await setup();
        fixture.detectChanges();

        const req = httpMock.expectOne('http://api.test/api/catalog/products/item-1');
        req.flush({ success: true, data: detail('image') });
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('video')).toBeFalsy();
        const img = el.querySelector('img');
        expect(img?.getAttribute('src')).toBe('http://media/cover.jpg');
        httpMock.verify();
    });

    it('выставляет SEO-мету товара через SeoService (title + og:image=cover.url)', async () => {
        const { fixture, httpMock, seoSet } = await setup();
        fixture.detectChanges();

        const req = httpMock.expectOne('http://api.test/api/catalog/products/item-1');
        req.flush({ success: true, data: detail('image') });
        fixture.detectChanges();

        expect(seoSet).toHaveBeenCalled();
        const arg = seoSet.mock.calls.at(-1)?.[0];
        // LanguageService по умолчанию en (DEFAULT_LANG) — берётся title.en = 'Item'.
        expect(arg.title).toBe('Item');
        expect(arg.image).toBe('http://media/cover.jpg');
        expect(arg.type).toBe('product');
        httpMock.verify();
    });

    it('фолбэк: при ошибке видео показывает <img src=thumbnailUrl>', async () => {
        const { fixture, httpMock } = await setup();
        fixture.detectChanges();

        const req = httpMock.expectOne('http://api.test/api/catalog/products/item-1');
        req.flush({ success: true, data: detail('video', 'http://media/poster.jpg') });
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        const video = el.querySelector('video');
        video?.dispatchEvent(new Event('error'));
        fixture.detectChanges();

        expect(el.querySelector('video')).toBeFalsy();
        const img = el.querySelector('img');
        expect(img?.getAttribute('src')).toBe('http://media/poster.jpg');
        httpMock.verify();
    });
});
