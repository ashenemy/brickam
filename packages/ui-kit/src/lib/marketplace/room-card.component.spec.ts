import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RoomCardComponent } from './room-card.component';

@Component({
    standalone: true,
    imports: [RoomCardComponent],
    template: `
        <bh-room-card [image]="image" [label]="label" [height]="height" (cardClick)="onClick()" />
    `,
})
class HostComponent {
    image: string | undefined = 'living.jpg';
    label = 'Living room';
    height = 280;
    clicks = 0;
    onClick() {
        this.clicks++;
    }
}

describe('RoomCardComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    it('рендерит label из input', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        expect((fixture.nativeElement as HTMLElement).textContent).toContain('Living room');
    });

    it('задаёт src/alt у изображения', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const img = (fixture.nativeElement as HTMLElement).querySelector('img') as HTMLImageElement;
        expect(img.getAttribute('src')).toBe('living.jpg');
        expect(img.getAttribute('alt')).toBe('Living room');
    });

    it('применяет высоту через style', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const link = (fixture.nativeElement as HTMLElement).querySelector('a') as HTMLElement;
        expect(link.style.height).toBe('280px');
    });

    it('эмитит cardClick по клику', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        (fixture.nativeElement as HTMLElement).querySelector('a')!.click();
        expect(fixture.componentInstance.clicks).toBe(1);
    });

    it('не рендерит img без image', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.image = undefined;
        fixture.detectChanges();
        await fixture.whenStable();
        expect((fixture.nativeElement as HTMLElement).querySelector('img')).toBeNull();
    });
});
