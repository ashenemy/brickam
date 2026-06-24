import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal.component';

@Component({
    standalone: true,
    imports: [ModalComponent],
    template: `
        <bh-modal
            [(open)]="open"
            [title]="title"
            [closeOnBackdrop]="closeOnBackdrop"
            (close)="onClose()"
        >
            <p>Body content</p>
            <button slot="footer">OK</button>
        </bh-modal>
    `,
})
class HostComponent {
    open = true;
    title = 'Pick a size';
    closeOnBackdrop = true;
    closes = 0;
    onClose() {
        this.closes++;
    }
}

function getDialog(): HTMLElement | null {
    return document.querySelector('[role="dialog"]');
}

describe('ModalComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    it('рендерит диалог и контент при open=true', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        const dialog = getDialog();
        expect(dialog).toBeTruthy();
        expect(dialog?.textContent).toContain('Body content');
    });

    it('не рендерит диалог при open=false', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.open = false;
        fixture.detectChanges();
        await fixture.whenStable();
        expect(getDialog()).toBeNull();
    });

    it('проставляет a11y-атрибуты (role/aria-modal/aria-labelledby)', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        const dialog = getDialog()!;
        expect(dialog.getAttribute('aria-modal')).toBe('true');
        const labelId = dialog.getAttribute('aria-labelledby');
        expect(labelId).toBeTruthy();
        const heading = dialog.querySelector(`#${labelId}`);
        expect(heading?.textContent?.trim()).toBe('Pick a size');
    });

    it('эмитит close и закрывается по кнопке ×', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        const closeBtn = getDialog()!.querySelector(
            'button[aria-label="Close"]',
        ) as HTMLButtonElement;
        closeBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(fixture.componentInstance.closes).toBe(1);
        expect(fixture.componentInstance.open).toBe(false);
        expect(getDialog()).toBeNull();
    });

    it('эмитит close по клику на бэкдроп', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        const backdrop = fixture.nativeElement.querySelector('.fixed') as HTMLElement;
        backdrop.click();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(fixture.componentInstance.closes).toBe(1);
    });

    it('не закрывается по бэкдропу при closeOnBackdrop=false', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.closeOnBackdrop = false;
        fixture.detectChanges();
        await fixture.whenStable();
        const backdrop = fixture.nativeElement.querySelector('.fixed') as HTMLElement;
        backdrop.click();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(fixture.componentInstance.closes).toBe(0);
        expect(getDialog()).toBeTruthy();
    });
});
