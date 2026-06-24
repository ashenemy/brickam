import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RadioComponent } from './radio.component';

@Component({
    standalone: true,
    imports: [RadioComponent],
    template: `
        <bh-radio
            name="grp"
            [optionValue]="'a'"
            label="A"
            [disabled]="disabled"
            [(value)]="value"
            (changed)="onChanged($event)"
        />
        <bh-radio name="grp" [optionValue]="'b'" label="B" [(value)]="value" />
    `,
})
class HostComponent {
    disabled = false;
    value: string | number | undefined = undefined;
    changedValue: string | number | null = null;
    onChanged(v: string | number) {
        this.changedValue = v;
    }
}

describe('RadioComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    it('рендерит нативные input[type=radio] с общим name', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const inputs = fixture.nativeElement.querySelectorAll('input[type=radio]');
        expect(inputs.length).toBe(2);
        expect((inputs[0] as HTMLInputElement).name).toBe('grp');
    });

    it('выбор radio устанавливает value группы и эмитит changed', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const inputs = fixture.nativeElement.querySelectorAll('input');
        (inputs[0] as HTMLInputElement).click();
        await fixture.whenStable();
        expect(fixture.componentInstance.value).toBe('a');
        expect(fixture.componentInstance.changedValue).toBe('a');
    });

    it('checked отражает совпадение value с optionValue', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.value = 'b';
        fixture.detectChanges();
        await fixture.whenStable();
        const inputs = fixture.nativeElement.querySelectorAll('input');
        expect((inputs[0] as HTMLInputElement).checked).toBe(false);
        expect((inputs[1] as HTMLInputElement).checked).toBe(true);
    });

    it('disabled блокирует input', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.disabled = true;
        fixture.detectChanges();
        await fixture.whenStable();
        const inputs = fixture.nativeElement.querySelectorAll('input');
        expect((inputs[0] as HTMLInputElement).disabled).toBe(true);
    });
});
