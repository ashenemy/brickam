import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BadgeComponent, type BadgeTone } from './badge.component';

@Component({
    standalone: true,
    imports: [BadgeComponent],
    template: `<bh-badge [tone]="tone">-20%</bh-badge>`,
})
class HostComponent {
    tone: BadgeTone = 'accent';
}

describe('BadgeComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    it('рендерит контент в mat-chip', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        expect(fixture.nativeElement.querySelector('mat-chip').textContent).toContain('-20%');
    });

    it('применяет класс тона danger (перекраска через --mat-chip-*)', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.tone = 'danger';
        fixture.detectChanges();
        await fixture.whenStable();
        expect(fixture.nativeElement.querySelector('mat-chip').className).toContain(
            'bh-badge-danger',
        );
    });
});
