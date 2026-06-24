import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';

@Component({
    standalone: true,
    imports: [NavbarComponent],
    template: `
        <bh-navbar
            [navItems]="navItems"
            [active]="active"
            [cartCount]="cartCount"
            (nav)="onNav($event)"
            (cart)="onCart()"
            (categories)="onCategories()"
            (search)="onSearch($event)"
            (langChange)="onLang()"
        />
    `,
})
class HostComponent {
    navItems = ['About us', 'Delivery'];
    active = 'Delivery';
    cartCount = 3;
    navValue = '';
    carts = 0;
    cats = 0;
    searchValue = '';
    langs = 0;
    onNav(v: string) {
        this.navValue = v;
    }
    onCart() {
        this.carts++;
    }
    onCategories() {
        this.cats++;
    }
    onSearch(v: string) {
        this.searchValue = v;
    }
    onLang() {
        this.langs++;
    }
}

describe('NavbarComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    it('рендерит nav-элементы из input', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(text).toContain('About us');
        expect(text).toContain('Delivery');
    });

    it('показывает счётчик корзины', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const badge = (fixture.nativeElement as HTMLElement).querySelector(
            '[aria-label="3 items in cart"]',
        );
        expect(badge?.textContent?.trim()).toBe('3');
    });

    it('эмитит nav по клику на пункт', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const link = Array.from(
            (fixture.nativeElement as HTMLElement).querySelectorAll('nav a'),
        ).find((a) => a.textContent?.includes('About us')) as HTMLAnchorElement;
        link.click();
        expect(fixture.componentInstance.navValue).toBe('About us');
    });

    it('эмитит categories по клику на кнопку', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const btn = Array.from(
            (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
        ).find((b) => b.textContent?.includes('Categories')) as HTMLButtonElement;
        btn.click();
        expect(fixture.componentInstance.cats).toBe(1);
    });

    it('бургер-кнопка раскрывает мобильное меню', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('nav[aria-label="Primary mobile"]')).toBeNull();
        const burger = el.querySelector(
            '[aria-label="Toggle navigation menu"]',
        ) as HTMLButtonElement;
        burger.click();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(el.querySelector('nav[aria-label="Primary mobile"]')).toBeTruthy();
    });
});
