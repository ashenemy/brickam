import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SearchBarComponent } from './search-bar.component';

@Component({
    standalone: true,
    imports: [SearchBarComponent],
    template: `<bh-search-bar
        [placeholder]="placeholder"
        [(value)]="value"
        (submitted)="onSubmit($event)"
    />`,
})
class HostComponent {
    placeholder = 'Find parts';
    value = '';
    submittedValue: string | null = null;
    onSubmit(v: string) {
        this.submittedValue = v;
    }
}

describe('SearchBarComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    });

    it('применяет placeholder к инпуту', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
        expect(input.placeholder).toBe('Find parts');
    });

    it('two-way обновляет value при вводе', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
        input.value = 'brake';
        input.dispatchEvent(new Event('input'));
        await fixture.whenStable();
        expect(fixture.componentInstance.value).toBe('brake');
    });

    it('эмитит submitted с текущим value по submit формы', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.componentInstance.value = 'tyre';
        fixture.detectChanges();
        await fixture.whenStable();
        const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
        form.dispatchEvent(new Event('submit'));
        expect(fixture.componentInstance.submittedValue).toBe('tyre');
    });

    it('go-кнопка имеет aria-label и type=submit', async () => {
        const fixture = TestBed.createComponent(HostComponent);
        await fixture.whenStable();
        const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
        expect(btn.type).toBe('submit');
        expect(btn.getAttribute('aria-label')).toBe('Search');
    });
});
