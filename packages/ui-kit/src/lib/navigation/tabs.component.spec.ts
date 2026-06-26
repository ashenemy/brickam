import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type TabItem, TabsComponent, type TabValue } from './tabs.component';

@Component({
    standalone: true,
    imports: [TabsComponent],
    template: `
        <bh-tabs [tabs]="tabs" [(value)]="value" (changed)="onChange($event)">
            <p>panel content</p>
        </bh-tabs>
    `,
})
class HostComponent {
    tabs: (TabItem | string)[] = [
        { label: 'Все', value: 'all' },
        { label: 'Кирпич', value: 'brick' },
        { label: 'Блоки', value: 'blocks' },
    ];
    value: TabValue | undefined = 'all';
    changes: TabValue[] = [];
    onChange(v: TabValue) {
        this.changes.push(v);
    }
}

describe('TabsComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    function tabs(fixture: ReturnType<typeof TestBed.createComponent>): HTMLButtonElement[] {
        return Array.from(fixture.nativeElement.querySelectorAll('[role="tab"]'));
    }

    it('рендерит N вкладок с role=tab', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const els = tabs(fixture);
        expect(els.length).toBe(3);
        expect(els[1].textContent?.trim()).toContain('Кирпич');
    });

    it('помечает активную вкладку aria-selected', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const els = tabs(fixture);
        expect(els[0].getAttribute('aria-selected')).toBe('true');
        expect(els[1].getAttribute('aria-selected')).toBe('false');
        expect(els[0].getAttribute('tabindex')).toBe('0');
        expect(els[1].getAttribute('tabindex')).toBe('-1');
    });

    it('переключает активную вкладку по клику и эмитит changed + two-way', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const els = tabs(fixture);
        els[1].click();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(fixture.componentInstance.value).toBe('brick');
        expect(fixture.componentInstance.changes).toEqual(['brick']);
        expect(els[1].getAttribute('aria-selected')).toBe('true');
    });

    it('ArrowRight двигает фокус (ручная активация mat-tab-nav-bar, value не меняется)', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const els = tabs(fixture);
        els[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();
        // ARIA «manual activation» (mat-tab-nav-bar): стрелка переносит фокус, но НЕ
        // активирует — value меняется только по клику/Enter (см. тест клика выше).
        expect(fixture.componentInstance.value).toBe('all');
        expect(fixture.componentInstance.changes).toEqual([]);
    });

    it('рендерит tabpanel и проецирует контент', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const panel = fixture.nativeElement.querySelector('[role="tabpanel"]') as HTMLElement;
        expect(panel).toBeTruthy();
        expect(panel.textContent?.trim()).toContain('panel content');
    });
});
