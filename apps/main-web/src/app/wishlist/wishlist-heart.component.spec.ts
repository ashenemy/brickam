import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { WishlistStore } from './wishlist.store';
import { WishlistHeartComponent } from './wishlist-heart.component';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

@Component({
    standalone: true,
    imports: [WishlistHeartComponent],
    template: `<app-wishlist-heart productId="p1" />`,
})
class HostComponent {}

describe('WishlistHeartComponent', () => {
    let fixture: ComponentFixture<HostComponent>;
    let store: WishlistStore;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HostComponent],
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(HostComponent);
        store = TestBed.inject(WishlistStore);
    });

    it('сердечко заполнено когда has=true', () => {
        store.ids.set(new Set(['p1']));
        fixture.detectChanges();
        const path = (fixture.nativeElement as HTMLElement).querySelector('svg');
        expect(path?.getAttribute('fill')).toBe('currentColor');
    });

    it('сердечко не заполнено когда has=false', () => {
        store.ids.set(new Set());
        fixture.detectChanges();
        const path = (fixture.nativeElement as HTMLElement).querySelector('svg');
        expect(path?.getAttribute('fill')).toBe('none');
    });

    it('клик вызывает store.toggle', () => {
        const spy = vi.spyOn(store, 'toggle');
        fixture.detectChanges();
        const button = (fixture.nativeElement as HTMLElement).querySelector('button');
        button?.click();
        expect(spy).toHaveBeenCalledWith('p1');
    });
});
