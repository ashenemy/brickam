import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BreadcrumbComponent, type CrumbItem } from './breadcrumb.component';

@Component({
    standalone: true,
    imports: [BreadcrumbComponent],
    template: `<bh-breadcrumb [items]="items" (navigated)="onNav($event)" />`,
})
class HostComponent {
    items: (CrumbItem | string)[] = [
        { label: 'Главная', href: '/' },
        { label: 'Каталог', href: '/catalog' },
        { label: 'Кирпич' },
    ];
    nav: CrumbItem[] = [];
    onNav(c: CrumbItem) {
        this.nav.push(c);
    }
}

describe('BreadcrumbComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    it('рендерит nav с aria-label и список крошек', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
        expect(nav.getAttribute('aria-label')).toBe('Breadcrumb');
        const lis = fixture.nativeElement.querySelectorAll('li');
        expect(lis.length).toBe(3);
    });

    it('последняя крошка имеет aria-current="page" и не является ссылкой', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const current = fixture.nativeElement.querySelector('[aria-current="page"]') as HTMLElement;
        expect(current).toBeTruthy();
        expect(current.textContent?.trim()).toBe('Кирпич');
        expect(current.tagName.toLowerCase()).toBe('span');
    });

    it('промежуточные крошки рендерятся как ссылки с href', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const links = fixture.nativeElement.querySelectorAll('a');
        expect(links.length).toBe(2);
        expect(links[0].getAttribute('href')).toBe('/');
    });

    it('разделители декоративны (aria-hidden) и их на один меньше', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const seps = fixture.nativeElement.querySelectorAll('[aria-hidden="true"]');
        expect(seps.length).toBe(2);
    });

    it('эмитит navigated при клике по ссылке', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
        link.addEventListener('click', (e) => e.preventDefault());
        link.click();
        expect(fixture.componentInstance.nav.length).toBe(1);
        expect(fixture.componentInstance.nav[0].label).toBe('Главная');
    });
});
