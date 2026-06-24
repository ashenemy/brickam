import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ToastComponent, ToastTone } from './toast.component';

@Component({
    standalone: true,
    imports: [ToastComponent],
    template: `
        <bh-toast [tone]="tone" [duration]="duration" (closed)="onClosed()">Added to cart</bh-toast>
    `,
})
class HostComponent {
    tone: ToastTone = 'success';
    duration = 0;
    closes = 0;
    onClosed() {
        this.closes++;
    }
}

describe('ToastComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    it('рендерит контент и role=status', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        const status = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
        expect(status).toBeTruthy();
        expect(status.getAttribute('aria-live')).toBe('polite');
        expect(status.textContent).toContain('Added to cart');
    });

    it('применяет цвет акцент-бара по тону danger', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.tone = 'danger';
        fixture.detectChanges();
        await fixture.whenStable();
        const bar = fixture.nativeElement.querySelector('span.absolute') as HTMLElement;
        expect(bar.className).toContain('bg-danger');
    });

    it('эмитит closed по клику на кнопку закрытия', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        const btn = fixture.nativeElement.querySelector(
            'button[aria-label="Dismiss"]',
        ) as HTMLButtonElement;
        btn.click();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(fixture.componentInstance.closes).toBe(1);
    });

    it('авто-дисмисс по таймеру duration', () => {
        vi.useFakeTimers();
        try {
            const fixture = TestBed.createComponent(HostComponent);
            fixture.componentInstance.duration = 3000;
            fixture.detectChanges();
            vi.advanceTimersByTime(2999);
            expect(fixture.componentInstance.closes).toBe(0);
            vi.advanceTimersByTime(1);
            expect(fixture.componentInstance.closes).toBe(1);
        } finally {
            vi.useRealTimers();
        }
    });

    it('не запускает авто-дисмисс при duration=0', () => {
        vi.useFakeTimers();
        try {
            const fixture = TestBed.createComponent(HostComponent);
            fixture.componentInstance.duration = 0;
            fixture.detectChanges();
            vi.advanceTimersByTime(10000);
            expect(fixture.componentInstance.closes).toBe(0);
        } finally {
            vi.useRealTimers();
        }
    });
});
