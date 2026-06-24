import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FeatureBarComponent, FeatureItem } from './feature-bar.component';

@Component({
    standalone: true,
    imports: [FeatureBarComponent],
    template: `<bh-feature-bar [items]="items" />`,
})
class HostComponent {
    items: FeatureItem[] = [
        { title: 'Fast Delivery', subtitle: 'In 24 hours' },
        { title: 'Secure Payment', subtitle: 'Protected' },
        { title: 'Support 24-7' },
    ];
}

describe('FeatureBarComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    it('рендерит по элементу на каждый item', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        expect((fixture.nativeElement as HTMLElement).querySelectorAll('li').length).toBe(3);
    });

    it('рендерит title и subtitle', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(text).toContain('Fast Delivery');
        expect(text).toContain('In 24 hours');
    });

    it('не рендерит subtitle если он не задан', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const last = (fixture.nativeElement as HTMLElement).querySelectorAll('li')[2];
        expect(last.textContent).toContain('Support 24-7');
        // у пункта без subtitle не должно протечь чужого подзаголовка
        expect(last.textContent).not.toContain('In 24 hours');
    });

    it('применяет оранжевый фон полосы', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const ul = (fixture.nativeElement as HTMLElement).querySelector('ul') as HTMLElement;
        expect(ul.className).toContain('bg-accent');
    });
});
