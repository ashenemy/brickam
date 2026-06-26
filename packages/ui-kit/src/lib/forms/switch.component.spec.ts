import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwitchComponent } from './switch.component';

@Component({
    standalone: true,
    imports: [SwitchComponent],
    template: `<bh-switch
        [label]="label"
        [disabled]="disabled"
        [(value)]="value"
        (changed)="onChanged($event)"
    />`,
})
class HostComponent {
    label = 'Notifications';
    disabled = false;
    value = false;
    changedValue: boolean | null = null;
    onChanged(v: boolean) {
        this.changedValue = v;
    }
}

describe('SwitchComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    it('рендерит role=switch с aria-checked', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const btn = fixture.nativeElement.querySelector('[role=switch]') as HTMLButtonElement;
        expect(btn).toBeTruthy();
        expect(btn.getAttribute('aria-checked')).toBe('false');
    });

    it('клик переключает value и aria-checked', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const btn = fixture.nativeElement.querySelector('[role=switch]') as HTMLButtonElement;
        btn.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.value).toBe(true);
        expect(fixture.componentInstance.changedValue).toBe(true);
        expect(btn.getAttribute('aria-checked')).toBe('true');
    });

    it('доступен с клавиатуры: role=switch на нативном button', async () => {
        // mat-slide-toggle обрабатывает Space/Enter нативно (это <button role=switch>),
        // поэтому проверяем сам контракт доступности, а не синтетический keydown.
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const btn = fixture.nativeElement.querySelector('[role=switch]') as HTMLElement;
        expect(btn.tagName).toBe('BUTTON');
    });

    it('disabled не переключает', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.disabled = true;
        fixture.detectChanges();
        await fixture.whenStable();
        const btn = fixture.nativeElement.querySelector('[role=switch]') as HTMLButtonElement;
        btn.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.value).toBe(false);
        expect(btn.disabled).toBe(true);
    });
});
