import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AiAssistantPageComponent } from './ai-assistant-page.component';
import type { AiJob } from './models';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

const JOBS = 'http://api.test/api/ai-assistant/jobs';

function doneImage(): AiJob {
    return {
        id: 'j1',
        type: 'image',
        status: 'done',
        progress: 100,
        result: 'http://x/img.png',
    };
}

describe('AiAssistantPageComponent', () => {
    let fixture: ComponentFixture<AiAssistantPageComponent>;
    let httpMock: HttpTestingController;

    function setup(initial: AiJob[]): void {
        fixture = TestBed.createComponent(AiAssistantPageComponent);
        httpMock = TestBed.inject(HttpTestingController);
        const req = httpMock.expectOne(JOBS);
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: initial });
        fixture.detectChanges();
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AiAssistantPageComponent],
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        }).compileComponents();
    });

    afterEach(() => {
        vi.useRealTimers();
        httpMock.verify();
    });

    it('показывает empty при пустом списке', () => {
        setup([]);
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('[data-testid="empty"]')).not.toBeNull();
    });

    it('рендерит список задач со статусом и прогрессом', () => {
        setup([{ ...doneImage(), progress: 100 }]);
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelectorAll('[data-testid="job"]').length).toBe(1);
        const bar = el.querySelector('[data-testid="bar"]') as HTMLElement;
        expect(bar.style.width).toBe('100%');
        expect(el.querySelector('[data-testid="result-image"]')).not.toBeNull();
    });

    it('«Сгенерировать» вызывает create и добавляет job в список', () => {
        setup([]);
        const comp = fixture.componentInstance as unknown as {
            prompt: { set: (v: string) => void };
            generate: () => void;
        };
        comp.prompt.set('сделай описание');
        comp.generate();

        const req = httpMock.expectOne(JOBS);
        expect(req.request.method).toBe('POST');
        expect(req.request.body.userPrompt).toBe('сделай описание');
        req.flush({
            success: true,
            data: { id: 'jNew', type: 'description', status: 'done', progress: 100, result: 'txt' },
        });
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelectorAll('[data-testid="job"]').length).toBe(1);
        expect(el.querySelector('[data-testid="result-text"]')?.textContent).toContain('txt');
    });

    it('«Прикрепить» вызывает attach', () => {
        setup([doneImage()]);
        const comp = fixture.componentInstance as unknown as {
            attach: (j: AiJob) => void;
        };
        comp.attach(doneImage());

        const req = httpMock.expectOne(`${JOBS}/j1/attach`);
        expect(req.request.method).toBe('POST');
        req.flush({ success: true, data: { ...doneImage() } });
    });

    it('опрашивает активные задачи через get по таймеру', () => {
        vi.useFakeTimers();
        setup([{ id: 'j1', type: 'image', status: 'processing', progress: 10 }]);

        vi.advanceTimersByTime(2000);
        const req = httpMock.expectOne(`${JOBS}/j1`);
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: doneImage() });
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        const bar = el.querySelector('[data-testid="bar"]') as HTMLElement;
        expect(bar.style.width).toBe('100%');
    });
});
