import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';

@Component({
    standalone: true,
    imports: [FooterComponent],
    template: `
        <bh-footer
            [socials]="socials"
            [legal]="legal"
            [copyright]="copyright"
            (socialClick)="onSocial($event)"
            (legalClick)="onLegal($event)"
        />
    `,
})
class HostComponent {
    socials = ['Facebook', 'Instagram'];
    legal = ['Terms of use', 'Privacy policy'];
    copyright = 'Copyright © 2026';
    social = '';
    legalValue = '';
    onSocial(v: string) {
        this.social = v;
    }
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

    it('рендерит соц-кнопки с aria-label', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const fb = (fixture.nativeElement as HTMLElement).querySelector('[aria-label="Facebook"]');
        expect(fb).toBeTruthy();
        expect(fb?.textContent?.trim()).toBe('F');
    });

    it('эмитит socialClick по клику', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const fb = (fixture.nativeElement as HTMLElement).querySelector(
            '[aria-label="Instagram"]',
        ) as HTMLButtonElement;
        fb.click();
        expect(fixture.componentInstance.social).toBe('Instagram');
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
