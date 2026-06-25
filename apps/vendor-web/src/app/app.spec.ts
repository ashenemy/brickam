import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [App],
            providers: [provideRouter([])],
        }).compileComponents();
    });

    it('создаётся и рендерит шелл (навигация + footer)', async () => {
        const fixture = TestBed.createComponent(App);
        await fixture.whenStable();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('nav')).toBeTruthy();
        expect(el.querySelectorAll('nav a').length).toBeGreaterThan(0);
        expect(el.querySelector('bh-footer')).toBeTruthy();
    });
});
