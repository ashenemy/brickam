import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InputComponent } from './input.component';

@Component({
    standalone: true,
    imports: [InputComponent],
    template: `<bh-input
        [label]="label"
        [error]="error"
        [hint]="hint"
        [disabled]="disabled"
        [(value)]="value"
        (changed)="onChanged($event)"
    />`,
})
class HostComponent {
    label = 'Email';
    error = '';
    hint = '';
    disabled = false;
    value = '';
    changedValue = '';
    onChanged(v: string) {
        this.changedValue = v;
    }
}

describe('InputComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    it('рендерит лейбл, связанный с инпутом', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
        const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
        expect(label.textContent?.trim()).toContain('Email');
        expect(label.getAttribute('for')).toBe(input.id);
    });

    it('two-way обновляет value при вводе', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
        input.value = 'hello';
        input.dispatchEvent(new Event('input'));
        await fixture.whenStable();
        expect(fixture.componentInstance.value).toBe('hello');
    });

    it('error выставляет aria-invalid и текст ошибки', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.error = 'Required';
        fixture.detectChanges();
        await fixture.whenStable();
        const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(fixture.nativeElement.textContent).toContain('Required');
    });

    it('disabled блокирует инпут', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.disabled = true;
        fixture.detectChanges();
        await fixture.whenStable();
        const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
        expect(input.disabled).toBe(true);
    });
});
