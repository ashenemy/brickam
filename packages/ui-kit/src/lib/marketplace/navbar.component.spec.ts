import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type CategoryGroup, NavbarComponent, type SearchMode } from './navbar.component';

@Component({
    standalone: true,
    imports: [NavbarComponent],
    template: `
        <bh-navbar
            [navItems]="navItems"
            [active]="active"
            [groups]="groups"
            (nav)="navValue = $event"
            (search)="lastSearch = $event"
            (categoryNavigate)="lastCategory = $event"
            (menuToggle)="menuToggled = true"
        >
            <span slot="actions" data-testid="actions">ACTIONS</span>
        </bh-navbar>
    `,
})
class HostComponent {
    navItems = ['About us', 'Delivery'];
    active = 'Delivery';
    groups: CategoryGroup[] = [
        { slug: 'building', label: 'Building', items: [{ slug: 'cement', label: 'Cement' }] },
    ];
    navValue = '';
    lastSearch: { query: string; mode: SearchMode } | null = null;
    lastCategory = '';
    menuToggled = false;
}

function byText(root: HTMLElement, sel: string, text: string): HTMLElement | undefined {
    return Array.from(root.querySelectorAll<HTMLElement>(sel)).find((el) =>
        el.textContent?.includes(text),
    );
}

describe('NavbarComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    it('рендерит nav-элементы и проецируемые действия', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(text).toContain('About us');
        expect(text).toContain('Delivery');
        expect(text).toContain('ACTIONS');
    });

    it('эмитит nav по клику на пункт', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const link = byText(fixture.nativeElement, 'nav a', 'About us') as HTMLAnchorElement;
        link.click();
        expect(fixture.componentInstance.navValue).toBe('About us');
    });

    it('бургер эмитит menuToggle (открытие мобильного меню)', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const el = fixture.nativeElement as HTMLElement;
        expect(fixture.componentInstance.menuToggled).toBe(false);
        (el.querySelector('[aria-label="Open menu"]') as HTMLButtonElement).click();
        expect(fixture.componentInstance.menuToggled).toBe(true);
    });

    it('сабмит поиска эмитит query и режим (по умолчанию ai — textarea)', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const el = fixture.nativeElement as HTMLElement;
        const input = el.querySelector('textarea') as HTMLTextAreaElement;
        input.value = 'cement';
        input.dispatchEvent(new Event('input'));
        (el.querySelector('form') as HTMLFormElement).dispatchEvent(
            new Event('submit', { cancelable: true }),
        );
        expect(fixture.componentInstance.lastSearch).toEqual({ query: 'cement', mode: 'ai' });
    });
});
