import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IconButtonComponent } from './icon-button.component';

@Component({
    standalone: true,
    imports: [IconButtonComponent],
    template: `<bh-icon-button ariaLabel="Cart" [active]="active" (clicked)="onClick()">x</bh-icon-button>`,
})
class HostComponent {
    active = false;
    clicks = 0;
    onClick() {
        this.clicks++;
    }
}

describe('IconButtonComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    it('пробрасывает aria-label и контент', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
        expect(btn.getAttribute('aria-label')).toBe('Cart');
        expect(btn.textContent).toContain('x');
    });

    it('эмитит clicked', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        fixture.nativeElement.querySelector('button').click();
        expect(fixture.componentInstance.clicks).toBe(1);
    });

    it('active выставляет aria-pressed', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.active = true;
        fixture.detectChanges();
        await fixture.whenStable();
        const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
        expect(btn.getAttribute('aria-pressed')).toBe('true');
    });
});
