import {
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    effect,
    inject,
    input,
    output,
    signal,
} from '@angular/core';

export type ToastTone = 'success' | 'accent' | 'danger' | 'info';

/** Цвет акцент-бара/иконки по тону (через токены). */
const BAR: Record<ToastTone, string> = {
    success: 'bg-success',
    accent: 'bg-accent',
    danger: 'bg-danger',
    info: 'bg-text-secondary',
};

const ICON_TEXT: Record<ToastTone, string> = {
    success: 'text-success',
    accent: 'text-accent',
    danger: 'text-danger',
    info: 'text-text-secondary',
};

/**
 * BRICK Toast — кратковременное подтверждение ("Added to cart").
 * Glass-пилюля с акцент-баром слева. Перенесён с React (feedback/Toast.jsx).
 *
 * Дополнено поверх исходника: role="status" + aria-live="polite", вход/выход
 * через CSS-transition (translateY/opacity, токены motion), авто-дисмисс по
 * таймеру (`duration`, 0 = не скрывать), кнопка закрытия с aria-label.
 */
@Component({
    selector: 'bh-toast',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div
            role="status"
            aria-live="polite"
            class="relative inline-flex items-center gap-3 min-w-[280px] overflow-hidden py-4 px-[22px] rounded-md bg-surface-card text-text-primary shadow-[var(--shadow-float),inset_0_0_0_0.5px_var(--border-default)] transition-all duration-base ease-out"
            [class]="motionClasses()"
        >
            <span class="absolute left-0 top-0 bottom-0 w-1" [class]="barClass()"></span>

            <span class="inline-flex" [class]="iconClass()">
                <ng-content select="[slot=icon]" />
            </span>

            <span class="flex-1" style="font: var(--type-body)">
                <ng-content />
            </span>

            <button
                type="button"
                [attr.aria-label]="closeLabel()"
                class="ml-1 -mr-1 flex shrink-0 items-center justify-center w-6 h-6 rounded-sm border-0 bg-transparent text-text-tertiary text-16 leading-none cursor-pointer transition-colors duration-fast ease-out hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                (click)="dismiss()"
            >
                &times;
            </button>
        </div>
    `,
})
export class ToastComponent {
    private readonly destroyRef = inject(DestroyRef);

    readonly tone = input<ToastTone>('success');
    /** Авто-дисмисс через N мс. 0 — не скрывать автоматически. */
    readonly duration = input(4000);
    readonly closeLabel = input('Dismiss');
    readonly closed = output<void>();

    protected readonly leaving = signal(false);
    private timer: ReturnType<typeof setTimeout> | null = null;

    protected readonly barClass = computed(() => BAR[this.tone()]);
    protected readonly iconClass = computed(() => ICON_TEXT[this.tone()]);
    protected readonly motionClasses = computed(() =>
        this.leaving() ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0',
    );

    constructor() {
        effect((onCleanup) => {
            const ms = this.duration();
            this.clearTimer();
            if (ms > 0) {
                this.timer = setTimeout(() => this.dismiss(), ms);
            }
            onCleanup(() => this.clearTimer());
        });
        this.destroyRef.onDestroy(() => this.clearTimer());
    }

    protected dismiss(): void {
        this.clearTimer();
        this.leaving.set(true);
        this.closed.emit();
    }

    private clearTimer(): void {
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}
