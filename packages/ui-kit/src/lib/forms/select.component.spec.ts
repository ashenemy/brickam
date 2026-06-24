import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    it('показывает placeholder, когда ничего не выбрано', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
        expect(trigger.textContent).toContain('Pick one');
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('показывает лейбл выбранного значения', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.value = 'audi';
        fixture.detectChanges();
        await fixture.whenStable();
        const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
        expect(trigger.textContent).toContain('Audi');
    });

    it('открывает список по клику и рендерит опции', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
        trigger.click();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        const options = document.querySelectorAll('[role="listbox"] [role="option"]');
        expect(options.length).toBe(2);
    });

    it('выбор опции обновляет value и закрывает список', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
        trigger.click();
        fixture.detectChanges();
        await fixture.whenStable();
        const options = document.querySelectorAll('[role="option"]');
        (options[0] as HTMLElement).click();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(fixture.componentInstance.value).toBe('bmw');
        expect(fixture.componentInstance.changedValue).toBe('bmw');
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });
});
