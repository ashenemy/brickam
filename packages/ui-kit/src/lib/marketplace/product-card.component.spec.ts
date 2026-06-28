import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Product, ProductCardComponent } from './product-card.component';

@Component({
    standalone: true,
    imports: [ProductCardComponent],
    template: `
        <bh-product-card
            [product]="product"
            (addToCart)="onAdd($event)"
            (cardClick)="onClick($event)"
        />
    `,
})
class HostComponent {
    product: Product = {
        id: 1,
        title: 'Glass Brick',
        vendor: 'BRICK Co',
        price: '1 200 ₽',
        oldPrice: '1 500 ₽',
        unit: 'Per item',
        rating: 4.8,
        image: 'brick.jpg',
        badge: '-20%',
    };
    added = 0;
    clicks = 0;
    onAdd(_: Product) {
        this.added++;
    }
    onClick(_: Product) {
        this.clicks++;
    }
}

describe('ProductCardComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    it('рендерит title, vendor и price из input', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(text).toContain('Glass Brick');
        expect(text).toContain('BRICK Co');
        expect(text).toContain('1 200 ₽');
    });

    it('рендерит badge и alt у изображения', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('bh-badge')?.textContent).toContain('-20%');
        const img = el.querySelector('img') as HTMLImageElement;
        expect(img.getAttribute('alt')).toBe('Glass Brick');
    });

    it('рендерит rating когда задан', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        expect((fixture.nativeElement as HTMLElement).querySelector('bh-rating')).toBeTruthy();
    });

    it('показывает фолбэк когда нет изображения', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        const { image: _omit, ...rest } = fixture.componentInstance.product;
        fixture.componentInstance.product = rest;
        fixture.detectChanges();
        await fixture.whenStable();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('img')).toBeNull();
        expect(el.textContent).toContain('No image');
    });
});
