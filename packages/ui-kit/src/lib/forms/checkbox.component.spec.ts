import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CheckboxComponent } from './checkbox.component';

@Component({
    standalone: true,
    imports: [CheckboxComponent],
    template: `<bh-checkbox
        [label]="label"
        [disabled]="disabled"
        [(value)]="value"
        (changed)="onChanged($event)"
    />`,
})
class HostComponent {
    label = 'Accept';
    disabled = false;
    value = false;
    changedValue: boolean | null = null;
    onChanged(v: boolean) {
        this.changedValue = v;
    }
}

describe('CheckboxComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    it('рендерит лейбл и нативный input[type=checkbox]', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const input = fixture.nativeElement.querySelector(
            'input[type=checkbox]',
        ) as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(fixture.nativeElement.textContent).toContain('Accept');
    });

    it('переключение чекбокса обновляет value и эмитит changed', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
        input.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.value).toBe(true);
        expect(fixture.componentInstance.changedValue).toBe(true);
    });

    it('отражает checked при value=true', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.value = true;
        fixture.detectChanges();
        await fixture.whenStable();
        const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
        expect(input.checked).toBe(true);
    });

    it('disabled блокирует input', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.disabled = true;
        fixture.detectChanges();
        await fixture.whenStable();
        const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
        expect(input.disabled).toBe(true);
    });
});
