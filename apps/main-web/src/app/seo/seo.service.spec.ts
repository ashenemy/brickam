import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { SeoService } from './seo.service';

describe('SeoService', () => {
    let service: SeoService;
    let setTitle: ReturnType<typeof vi.fn>;
    let updateTag: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        setTitle = vi.fn();
        updateTag = vi.fn();
        TestBed.configureTestingModule({
            providers: [
                SeoService,
                { provide: Title, useValue: { setTitle } },
                { provide: Meta, useValue: { updateTag } },
            ],
        });
        service = TestBed.inject(SeoService);
    });

    function tag(
        predicate: (def: Record<string, string>) => boolean,
    ): Record<string, string> | undefined {
        return updateTag.mock.calls.map((c) => c[0]).find(predicate);
    }

    it('ставит document title и meta description', () => {
        service.set({ title: 'T', description: 'D' });
        expect(setTitle).toHaveBeenCalledWith('T');
        expect(tag((d) => d['name'] === 'description')?.['content']).toBe('D');
    });

    it('ставит og:title/og:description/og:type (по умолчанию website) и twitter:card', () => {
        service.set({ title: 'T', description: 'D' });
        expect(tag((d) => d['property'] === 'og:title')?.['content']).toBe('T');
        expect(tag((d) => d['property'] === 'og:description')?.['content']).toBe('D');
        expect(tag((d) => d['property'] === 'og:type')?.['content']).toBe('website');
        expect(tag((d) => d['name'] === 'twitter:card')?.['content']).toBe('summary');
    });

    it('добавляет og:image/og:url и переключает twitter:card на summary_large_image', () => {
        service.set({
            title: 'T',
            description: 'D',
            image: 'http://img/c.jpg',
            url: 'http://site/p',
            type: 'product',
        });
        expect(tag((d) => d['property'] === 'og:image')?.['content']).toBe('http://img/c.jpg');
        expect(tag((d) => d['property'] === 'og:url')?.['content']).toBe('http://site/p');
        expect(tag((d) => d['property'] === 'og:type')?.['content']).toBe('product');
        expect(tag((d) => d['name'] === 'twitter:card')?.['content']).toBe('summary_large_image');
    });

    it('не ставит og:image без переданного image', () => {
        service.set({ title: 'T', description: 'D' });
        expect(tag((d) => d['property'] === 'og:image')).toBeUndefined();
    });
});
