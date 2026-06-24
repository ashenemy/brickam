import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface FeatureItem {
    icon?: string;
    title: string;
    subtitle?: string;
}

/**
 * FeatureBar — оранжевая trust-полоса (Fast Delivery / 24h Return /
 * Secure Payment / Support 24-7). Колонки разделены тонкими разделителями.
 * Адаптив: на мобильном колонки переносятся (auto-fit), без overflow.
 * Перенесён с React (marketplace/FeatureBar.jsx).
 */
@Component({
    selector: 'bh-feature-bar',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <ul
            class="grid list-none gap-px rounded-md bg-accent p-0 m-0"
            style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))"
        >
            @for (item of items(); track item.title) {
                <li
                    class="flex items-center gap-4 px-7 py-5 text-white border-l border-white/25 first:border-l-0"
                >
                    @if (item.icon) {
                        <span
                            class="inline-flex shrink-0 text-white"
                            [innerHTML]="item.icon"
                            aria-hidden="true"
                        ></span>
                    }
                    <div class="min-w-0">
                        <div style="font: var(--type-label); font-size: var(--fs-16)">
                            {{ item.title }}
                        </div>
                        @if (item.subtitle) {
                            <div class="mt-0.5 text-white/85" style="font: var(--type-caption)">
                                {{ item.subtitle }}
                            </div>
                        }
                    </div>
                </li>
            }
        </ul>
    `,
})
export class FeatureBarComponent {
    readonly items = input<FeatureItem[]>([]);
}
