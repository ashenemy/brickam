import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';

let switchUid = 0;

/**
 * BRICK Switch — тумблер для настроек (уведомления, тёмные поверхности).
 * Перенесён с React (forms/Switch.jsx). Фиксы a11y: role="switch" + aria-checked,
 * управление с клавиатуры (Space/Enter), связь с лейблом через aria-labelledby,
 * видимый focus-ring, disabled. Управляется через [(value)].
 */
@Component({
    selector: 'bh-switch',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div [class]="rootClasses()">
            <button
                type="button"
                role="switch"
                [attr.aria-checked]="value()"
                [attr.aria-labelledby]="label() ? id + '-label' : null"
                [disabled]="disabled()"
                [class]="trackClasses()"
                (click)="flip()"
                (keydown.enter)="onKey($event)"
                (keydown.space)="onKey($event)"
            >
                <span
                    class="block w-[22px] h-[22px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-base ease-out"
                    [style.transform]="value() ? 'translateX(20px)' : 'translateX(0)'"
                ></span>
            </button>
            @if (label()) {
                <span
                    [id]="id + '-label'"
                    class="text-text-primary"
                    style="font: var(--type-body)"
                    (click)="flip()"
                >
                    {{ label() }}
                </span>
            }
            <ng-content />
        </div>
    `,
})
export class SwitchComponent {
    readonly label = input<string>();
    readonly disabled = input(false);

    readonly value = model(false);
    readonly changed = output<boolean>();

    protected readonly id = `bh-switch-${switchUid++}`;

    protected readonly rootClasses = computed(() =>
        [
            'inline-flex items-center gap-3 select-none',
            this.disabled() ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        ].join(' '),
    );

    protected readonly trackClasses = computed(() =>
        [
            'inline-flex items-center w-12 h-7 shrink-0 rounded-pill p-[3px] border-0',
            'disabled:cursor-not-allowed',
            'transition-colors duration-base ease-soft',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]',
            this.disabled() ? '' : 'cursor-pointer',
            this.value()
                ? 'bg-accent shadow-accent'
                : 'bg-surface-chip shadow-[inset_0_0_0_1px_var(--border-default)]',
        ].join(' '),
    );

    protected onKey(event: Event): void {
        event.preventDefault();
        this.flip();
    }

    protected flip(): void {
        if (this.disabled()) return;
        const next = !this.value();
        this.value.set(next);
        this.changed.emit(next);
    }
}
