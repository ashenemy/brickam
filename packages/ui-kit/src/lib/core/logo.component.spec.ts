import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LogoComponent } from './logo.component';

@Component({
    standalone: true,
    imports: [LogoComponent],
    template: `<bh-logo [height]="32" [mark]="mark" />`,
})
class HostComponent {
    mark = false;
}

describe('LogoComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    it('рендерит знак + словесный знак (2 svg)', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        expect(fixture.nativeElement.querySelectorAll('svg').length).toBe(2);
        expect(fixture.nativeElement.querySelector('[aria-label="BRICK"]')).toBeTruthy();
    });

    it('mark=true скрывает словесный знак (1 svg)', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.mark = true;
        fixture.detectChanges();
        await fixture.whenStable();
        expect(fixture.nativeElement.querySelectorAll('svg').length).toBe(1);
    });
});
