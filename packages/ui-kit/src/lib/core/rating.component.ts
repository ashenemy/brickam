import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type Star = { id: string; fill: number };

/**
 * Rating — оценка из пяти звёзд (inline SVG, оранжевая заливка, дробные звёзды).
 * Перенесён с React (core/Rating.jsx).
 */
@Component({
    selector: 'bh-rating',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <span
            class="inline-flex items-center gap-1.5"
            role="img"
            [attr.aria-label]="ariaLabel()"
        >
            <span class="inline-flex gap-0.5">
                @for (star of stars(); track star.id) {
                    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" aria-hidden="true">
                        <defs>
                            <linearGradient [attr.id]="star.id">
                                <stop [attr.offset]="star.fill * 100 + '%'" stop-color="rgb(var(--color-accent))" />
                                <stop [attr.offset]="star.fill * 100 + '%'" stop-color="rgba(255,255,255,0.18)" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M12 2.5l2.7 5.9 6.3.7-4.7 4.3 1.3 6.2L12 16.9 6.1 19.6l1.3-6.2L2.7 9.1l6.3-.7z"
                            [attr.fill]="starFill(star)"
                        />
                    </svg>
                }
            </span>
            @if (showValue()) {
                <span class="text-text-primary" style="font: var(--type-product)">{{ value().toFixed(1) }}</span>
            }
            @if (count() !== null && count() !== undefined) {
                <span class="text-text-tertiary" style="font: var(--type-caption)">({{ count() }})</span>
            }
        </span>
    `,
})
export class RatingComponent {
    readonly value = input(0);
    readonly max = input(5);
    readonly size = input(16);
    readonly count = input<number | null>(null);
    readonly showValue = input(false);

    protected readonly stars = computed<Star[]>(() =>
        Array.from({ length: this.max() }, (_, i) => ({
            id: `bh-star-${i}-${Math.round(Math.max(0, Math.min(1, this.value() - i)) * 100)}`,
            fill: Math.max(0, Math.min(1, this.value() - i)),
        })),
    );

    protected readonly ariaLabel = computed(() => `${this.value().toFixed(1)} of ${this.max()}`);

    protected starFill(star: Star): string {
        if (star.fill <= 0) {
            return 'rgba(255,255,255,0.18)';
        }
        if (star.fill >= 1) {
            return 'rgb(var(--color-accent))';
        }
        return `url(#${star.id})`;
    }
}
