import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FooterComponent],
            providers: [provideRouter([])],
        }).compileComponents();
    });

    it('рендерит ссылки на CMS-страницы /p/about, /p/terms, /p/privacy', () => {
        const fixture = TestBed.createComponent(FooterComponent);
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;

        const hrefs = Array.from(el.querySelectorAll('a')).map((a) => a.getAttribute('href'));
        expect(hrefs).toContain('/p/about');
        expect(hrefs).toContain('/p/terms');
        expect(hrefs).toContain('/p/privacy');
    });

    it('показывает копирайт с текущим годом', () => {
        const fixture = TestBed.createComponent(FooterComponent);
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.textContent).toContain(String(new Date().getFullYear()));
    });
});
