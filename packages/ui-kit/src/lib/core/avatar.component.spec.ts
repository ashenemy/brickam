import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AvatarComponent } from './avatar.component';

@Component({
    standalone: true,
    imports: [AvatarComponent],
    template: `<bh-avatar [name]="name" [src]="src" />`,
})
class HostComponent {
    name = 'BRICK Vendor';
    src: string | null = null;
}

describe('AvatarComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    it('показывает инициалы-фолбэк без src', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        expect(fixture.nativeElement.textContent.trim()).toBe('BV');
    });

    it('рендерит img с alt при наличии src', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.src = 'logo.png';
        fixture.detectChanges();
        await fixture.whenStable();
        const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
        expect(img).toBeTruthy();
        expect(img.getAttribute('alt')).toBe('BRICK Vendor');
    });
});
