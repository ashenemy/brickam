import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SelectComponent, type SelectOption } from './select.component';

@Component({
    standalone: true,
    imports: [SelectComponent],
    template: `<bh-select
        [label]="label"
        [options]="options"
        [placeholder]="placeholder"
        [(value)]="value"
        (changed)="onChanged($event)"
    />`,
})
class HostComponent {
    label = 'Brand';
    placeholder = 'Pick one';
    options: (SelectOption | string)[] = [
        { label: 'BMW', value: 'bmw' },
        { label: 'Audi', value: 'audi' },
    ];
    value: string | number | undefined = undefined;
    changedValue: string | number | null = null;
    onChanged(v: string | number) {
        this.changedValue = v;
    }
}

describe('SelectComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HostComponent],
            providers: [provideNoopAnimations()],
        }).compileComponents();
    });

    it('показывает placeholder, когда ничего не выбрано', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const select = fixture.nativeElement.querySelector('mat-select') as HTMLElement;
        expect(select.textContent).toContain('Pick one');
        expect(select.getAttribute('aria-expanded')).toBe('false');
    });

    it('показывает лейбл выбранного значения', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.value = 'audi';
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        await fixture.whenStable();
        const select = fixture.nativeElement.querySelector('mat-select') as HTMLElement;
        expect(select.textContent).toContain('Audi');
    });

    it('открывает панель по клику и рендерит опции', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        (fixture.nativeElement.querySelector('.mat-mdc-select-trigger') as HTMLElement).click();
        fixture.detectChanges();
        await fixture.whenStable();
        const select = fixture.nativeElement.querySelector('mat-select') as HTMLElement;
        expect(select.getAttribute('aria-expanded')).toBe('true');
        expect(document.querySelectorAll('mat-option').length).toBe(2);
    });

    it('выбор опции обновляет value и закрывает панель', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        (fixture.nativeElement.querySelector('.mat-mdc-select-trigger') as HTMLElement).click();
        fixture.detectChanges();
        await fixture.whenStable();
        (document.querySelectorAll('mat-option')[0] as HTMLElement).click();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(fixture.componentInstance.value).toBe('bmw');
        expect(fixture.componentInstance.changedValue).toBe('bmw');
        const select = fixture.nativeElement.querySelector('mat-select') as HTMLElement;
        expect(select.getAttribute('aria-expanded')).toBe('false');
    });
});
