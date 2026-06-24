import { TestBed } from '@angular/core/testing';
import { LangSwitcherComponent, LanguageService } from '@brickam/i18n-kit/browser';

describe('LangSwitcher (переключатель языка)', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LangSwitcherComponent],
        }).compileComponents();
    });

    it('рендерит 3 языка и переключает текущий по клику', async () => {
        const fixture = TestBed.createComponent(LangSwitcherComponent);
        await fixture.whenStable();
        const svc = TestBed.inject(LanguageService);
        svc.setLang('hy');
        fixture.detectChanges();

        const buttons = fixture.nativeElement.querySelectorAll(
            'button',
        ) as NodeListOf<HTMLButtonElement>;
        expect(buttons.length).toBe(3);

        // порядок supported = ['hy','ru','en'] → индекс 1 это ru
        buttons[1].click();
        fixture.detectChanges();
        expect(svc.lang()).toBe('ru');
        expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    });
});
