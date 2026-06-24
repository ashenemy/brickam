import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

@Component({
    standalone: true,
    imports: [ButtonComponent],
    template: `<bh-button [variant]="variant" [disabled]="disabled" (clicked)="onClick()">Buy</bh-button>`,
})
class HostComponent {
    variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
    disabled = false;
    clicks = 0;
    onClick() {
        this.clicks++;
    }
}

describe('ButtonComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    it('рендерит контент через ng-content', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
        expect(btn.textContent?.trim()).toContain('Buy');
    });

    it('применяет классы варианта primary (через токены)', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
        expect(btn.className).toContain('bg-accent');
    });

    it('эмитит clicked по клику', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const host = fixture.componentInstance;
        fixture.nativeElement.querySelector('button').click();
        expect(host.clicks).toBe(1);
    });

    it('disabled блокирует кнопку', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.disabled = true;
        fixture.detectChanges();
        await fixture.whenStable();
        const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
        expect(btn.disabled).toBe(true);
    });
});
