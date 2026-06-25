import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CALCULATORS } from '@brickam/calc-kit';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { CalculatorsPageComponent } from './calculators-page.component';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

describe('CalculatorsPageComponent', () => {
    let fixture: ComponentFixture<CalculatorsPageComponent>;
    let router: Router;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CalculatorsPageComponent],
            providers: [provideRouter([]), { provide: RUNTIME_CONFIG, useValue: CONFIG }],
        }).compileComponents();

        fixture = TestBed.createComponent(CalculatorsPageComponent);
        router = TestBed.inject(Router);
    });

    function el(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    it('рендерит плитку для каждого калькулятора из CALCULATORS', () => {
        fixture.detectChanges();
        const tiles = el().querySelectorAll('[data-testid="calc-tile"]');
        expect(tiles.length).toBe(CALCULATORS.length);
    });

    it('выбор калькулятора показывает его поля', () => {
        fixture.detectChanges();
        // По умолчанию выбран первый (paint). Переключаемся на tile и проверяем поля.
        const tile = CALCULATORS.find((c) => c.key === 'tile');
        expect(tile).toBeDefined();
        const cmp = fixture.componentInstance as unknown as { select(key: string): void };
        cmp.select('tile');
        fixture.detectChanges();

        const inputs = el().querySelectorAll('[data-testid="calc-form"] bh-input');
        expect(inputs.length).toBe(tile?.fields.length);
    });

    it('«Рассчитать» с валидным вводом показывает результат (quantity/packages)', () => {
        fixture.detectChanges();
        const cmp = fixture.componentInstance as unknown as {
            selectedKey(): string;
            setValue(key: string, raw: string): void;
            onCalculate(e: Event): void;
        };
        // paint выбран по умолчанию; дефолты заполнены, заполняем area.
        const paint = CALCULATORS.find((c) => c.key === cmp.selectedKey());
        for (const f of paint?.fields ?? []) {
            cmp.setValue(f.key, String(f.default ?? 10));
        }
        cmp.onCalculate(new Event('submit'));
        fixture.detectChanges();

        const result = el().querySelector('[data-testid="calc-result"]');
        expect(result).not.toBeNull();
        expect(el().querySelector('[data-testid="result-quantity"]')?.textContent).toBeTruthy();
        expect(el().querySelector('[data-testid="result-packages"]')?.textContent).toBeTruthy();
    });

    it('пустой/нечисловой ввод показывает подсказку об ошибке', () => {
        fixture.detectChanges();
        const cmp = fixture.componentInstance as unknown as {
            setValue(key: string, raw: string): void;
            onCalculate(e: Event): void;
            selectedKey(): string;
        };
        const paint = CALCULATORS.find((c) => c.key === cmp.selectedKey());
        // Очищаем первое поле.
        const first = paint?.fields[0];
        if (first) {
            cmp.setValue(first.key, '');
        }
        cmp.onCalculate(new Event('submit'));
        fixture.detectChanges();

        expect(el().querySelector('[data-testid="calc-error"]')).not.toBeNull();
        expect(el().querySelector('[data-testid="calc-result"]')).toBeNull();
    });

    it('«Подобрать товары» вызывает router.navigate с category=categorySlug', () => {
        const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
        fixture.detectChanges();
        const cmp = fixture.componentInstance as unknown as {
            selectedKey(): string;
            setValue(key: string, raw: string): void;
            onCalculate(e: Event): void;
            pickProducts(res: unknown): void;
        };
        const calc = CALCULATORS.find((c) => c.key === cmp.selectedKey());
        for (const f of calc?.fields ?? []) {
            cmp.setValue(f.key, String(f.default ?? 10));
        }
        cmp.onCalculate(new Event('submit'));
        fixture.detectChanges();

        const btn = (fixture.nativeElement as HTMLElement).querySelector(
            '[data-testid="calc-result"] bh-button',
        );
        (btn as HTMLElement)?.querySelector('button')?.click();
        fixture.detectChanges();

        expect(spy).toHaveBeenCalledWith(['/catalog'], {
            queryParams: { category: calc?.categorySlug },
        });
    });
});
