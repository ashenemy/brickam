import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QuantityStepperComponent } from './quantity-stepper.component';

@Component({
    standalone: true,
    imports: [QuantityStepperComponent],
    template: `<bh-quantity-stepper
        [min]="min"
        [max]="max"
        [(value)]="value"
        (changed)="onChanged($event)"
    />`,
})
class HostComponent {
    min = 1;
    max = 3;
    value = 1;
    changedValue: number | null = null;
    onChanged(v: number) {
        this.changedValue = v;
    }
}

describe('QuantityStepperComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    function buttons(fixture: { nativeElement: HTMLElement }) {
        return fixture.nativeElement.querySelectorAll('button');
    }

    it('рендерит текущее значение', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.value = 2;
        fixture.detectChanges();
        await fixture.whenStable();
        expect(fixture.nativeElement.textContent).toContain('2');
    });

    it('+ увеличивает value и эмитит changed', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const inc = buttons(fixture)[1] as HTMLButtonElement;
        inc.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.value).toBe(2);
        expect(fixture.componentInstance.changedValue).toBe(2);
    });

    it('− кнопка disabled на минимуме', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const dec = buttons(fixture)[0] as HTMLButtonElement;
        expect(dec.disabled).toBe(true);
    });

    it('+ кнопка disabled на максимуме', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.value = 3;
        fixture.detectChanges();
        await fixture.whenStable();
        const inc = buttons(fixture)[1] as HTMLButtonElement;
        expect(inc.disabled).toBe(true);
    });

    it('не выходит за пределы max при кликах', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const inc = buttons(fixture)[1] as HTMLButtonElement;
        inc.click();
        await fixture.whenStable();
        inc.click();
        await fixture.whenStable();
        inc.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.value).toBe(3);
    });
});
