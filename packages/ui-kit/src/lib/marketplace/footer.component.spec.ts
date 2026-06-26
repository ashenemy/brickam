import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FooterComponent, type SocialLink } from './footer.component';

@Component({
    standalone: true,
    imports: [FooterComponent],
    template: `
        <bh-footer
            [socials]="socials"
            [legal]="legal"
            [copyright]="copyright"
            (legalClick)="onLegal($event)"
        />
    `,
})
class HostComponent {
    socials: SocialLink[] = [
        { platform: 'facebook', url: 'https://facebook.com/brickam' },
        { platform: 'instagram', url: 'https://instagram.com/brickam' },
    ];
    legal = ['Terms of use', 'Privacy policy'];
    copyright = 'Copyright © 2026';
    legalValue = '';
    onLegal(v: string) {
        this.legalValue = v;
    }
}

describe('FooterComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    it('рендерит copyright и legal-ссылки', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(text).toContain('Copyright © 2026');
        expect(text).toContain('Terms of use');
    });

    it('рендерит соц-ссылки как <a> с href и aria-label (бренд-иконка)', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const fb = (fixture.nativeElement as HTMLElement).querySelector(
            'a[aria-label="facebook"]',
        ) as HTMLAnchorElement;
        expect(fb).toBeTruthy();
        expect(fb.getAttribute('href')).toBe('https://facebook.com/brickam');
        // Бренд-иконка — inline SVG.
        expect(fb.querySelector('svg')).toBeTruthy();
    });

    it('не показывает соц-блок, когда ссылок нет', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.socials = [];
        fixture.detectChanges();
        await fixture.whenStable();
        expect(
            (fixture.nativeElement as HTMLElement).querySelector('a[aria-label="facebook"]'),
        ).toBeNull();
    });

    it('эмитит legalClick по клику', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const link = Array.from(
            (fixture.nativeElement as HTMLElement).querySelectorAll('nav[aria-label="Legal"] a'),
        ).find((a) => a.textContent?.includes('Privacy policy')) as HTMLAnchorElement;
        link.click();
        expect(fixture.componentInstance.legalValue).toBe('Privacy policy');
    });
});
