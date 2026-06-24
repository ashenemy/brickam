import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TagComponent } from './tag.component';

@Component({
    standalone: true,
    imports: [TagComponent],
    template: `<bh-tag
        [selected]="selected"
        [removable]="true"
        (toggled)="toggles = toggles + 1"
        (removed)="removes = removes + 1"
        >Cement</bh-tag
    >`,
})
class HostComponent {
    selected = false;
    toggles = 0;
    removes = 0;
}

describe('TagComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    it('рендерит как button с aria-pressed', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.selected = true;
        fixture.detectChanges();
        await fixture.whenStable();
        const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
        expect(btn.getAttribute('aria-pressed')).toBe('true');
        expect(btn.textContent).toContain('Cement');
    });

    it('эмитит toggled по клику', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        fixture.nativeElement.querySelector('button').click();
        expect(fixture.componentInstance.toggles).toBe(1);
    });

    it('эмитит removed по кнопке удаления', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const remove = fixture.nativeElement.querySelector('[aria-label="Remove"]') as HTMLElement;
        remove.click();
        expect(fixture.componentInstance.removes).toBe(1);
        expect(fixture.componentInstance.toggles).toBe(0);
    });
});
