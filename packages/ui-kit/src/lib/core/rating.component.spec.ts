import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RatingComponent } from './rating.component';

@Component({
    standalone: true,
    imports: [RatingComponent],
    template: `<bh-rating [value]="4.5" [max]="5" [count]="128" [showValue]="true" />`,
})
class HostComponent {}

describe('RatingComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    it('рендерит max звёзд и aria-label оценки', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const root = fixture.nativeElement.querySelector('[role="img"]') as HTMLElement;
        expect(root.getAttribute('aria-label')).toContain('4.5');
        expect(fixture.nativeElement.querySelectorAll('svg').length).toBe(5);
    });

    it('показывает значение и количество', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const text = fixture.nativeElement.textContent as string;
        expect(text).toContain('4.5');
        expect(text).toContain('128');
    });
});
