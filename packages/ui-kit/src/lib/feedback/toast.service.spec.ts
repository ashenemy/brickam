import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ToastService } from './toast.service';

describe('ToastService (MatSnackBar)', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideNoopAnimations()] });
    });

    it('показывает snackbar с сообщением', () => {
        const toast = TestBed.inject(ToastService);
        const ref = toast.show('Added to cart', { tone: 'success' });
        expect(ref).toBeTruthy();
        const container = document.querySelector('.mat-mdc-snack-bar-container');
        expect(container).toBeTruthy();
        expect(document.body.textContent).toContain('Added to cart');
        ref.dismiss();
    });

    it('пробрасывает действие и тон в panelClass', () => {
        const toast = TestBed.inject(ToastService);
        const ref = toast.show('Removed', { tone: 'danger', action: 'Undo' });
        const panel = document.querySelector('.bh-toast.bh-toast-danger');
        expect(panel).toBeTruthy();
        expect(document.body.textContent).toContain('Undo');
        ref.dismiss();
    });
});
