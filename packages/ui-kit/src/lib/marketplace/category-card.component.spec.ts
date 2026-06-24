import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CategoryCardComponent } from './category-card.component';

@Component({
    standalone: true,
    imports: [CategoryCardComponent],
    template: `<bh-category-card [image]="image" [label]="label" (cardClick)="onClick()" />`,
})
class HostComponent {
    image = 'tools.jpg';
    label = 'Power tools';
    clicks = 0;
    onClick() {
        this.clicks++;
    }
}

describe('CategoryCardComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    it('рендерит label из input', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        expect((fixture.nativeElement as HTMLElement).textContent).toContain('Power tools');
    });

    it('задаёт src/alt у изображения', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const img = (fixture.nativeElement as HTMLElement).querySelector('img') as HTMLImageElement;
        expect(img.getAttribute('src')).toBe('tools.jpg');
        expect(img.getAttribute('alt')).toBe('Power tools');
    });

    it('эмитит cardClick по клику', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        (fixture.nativeElement as HTMLElement).querySelector('a')!.click();
        expect(fixture.componentInstance.clicks).toBe(1);
    });

    it('имеет aria-label равный label', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const link = (fixture.nativeElement as HTMLElement).querySelector('a') as HTMLElement;
        expect(link.getAttribute('aria-label')).toBe('Power tools');
    });
});
