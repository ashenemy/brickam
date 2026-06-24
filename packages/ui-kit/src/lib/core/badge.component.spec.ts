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

    it('рендерит контент', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        expect(fixture.nativeElement.querySelector('span').textContent).toContain('-20%');
    });

    it('применяет класс тона danger через токены', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.tone = 'danger';
        fixture.detectChanges();
        await fixture.whenStable();
        expect(fixture.nativeElement.querySelector('span').className).toContain('text-danger');
    });
});
