import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { TemplatesComponent } from './templates.component';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

describe('TemplatesComponent', () => {
    let fixture: ComponentFixture<TemplatesComponent>;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [TemplatesComponent],
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        fixture = TestBed.createComponent(TemplatesComponent);
        httpMock = TestBed.inject(HttpTestingController);
        fixture.detectChanges();

        httpMock
            .expectOne('http://api.test/api/admin/templates')
            .flush({ success: true, data: [{ key: 'welcome' }] });
        httpMock.expectOne('http://api.test/api/admin/templates/welcome').flush({
            success: true,
            data: {
                key: 'welcome',
                content: { hy: '', ru: 'Привет, {name}', en: '' },
                variables: ['name'],
                subject: 'Hi',
            },
        });
        fixture.detectChanges();
    });

    afterEach(() => httpMock.verify());

    it('«Превью» вызывает preview API и показывает отрендеренный текст', () => {
        const previewBtn: HTMLButtonElement | null = fixture.nativeElement.querySelector(
            '[data-testid="preview-btn"] button',
        );
        expect(previewBtn).toBeTruthy();
        previewBtn?.click();

        const req = httpMock.expectOne('http://api.test/api/admin/templates/welcome/preview');
        expect(req.request.method).toBe('POST');
        expect(req.request.body.lang).toBe('ru');
        expect(req.request.body.vars).toEqual({ name: '{name}' });
        req.flush({ success: true, data: { rendered: 'Привет, Иван' } });
        fixture.detectChanges();

        const rendered = fixture.nativeElement.querySelector('[data-testid="preview-rendered"]');
        expect(rendered.textContent).toContain('Привет, Иван');
    });
});
