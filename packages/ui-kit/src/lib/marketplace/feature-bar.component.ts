import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

export interface FeatureItem {
    /** Имя Material Symbol (напр. local_shipping, autorenew, lock, support_agent). */
    icon?: string;
    title: string;
    subtitle?: string;
}

/**
 * FeatureBar — оранжевая trust-полоса (Fast Delivery / 30 days Return / Secure
 * Payment / Support 24-7). Иконки — официальный `mat-icon` (Material Symbols).
 * Адаптив: колонки переносятся (auto-fit minmax), без overflow.
 */
@Component({
    selector: 'bh-feature-bar',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatIcon],
    template: `
        <ul class="bh-feature-grid grid list-none gap-px rounded-md bg-accent p-0 m-0">
            @for (item of items(); track item.title) {
                <li
                    class="flex items-center gap-4 px-7 py-5 text-white border-l border-white/25 first:border-l-0"
                >
                    @if (item.icon) {
                        <mat-icon class="bh-feature-icon shrink-0 text-white" aria-hidden="true">{{
                            item.icon
                        }}</mat-icon>
                    }
                    <div class="min-w-0">
                        <div style="font: var(--type-label); font-size: var(--fs-20)">
                            {{ item.title }}
                        </div>
                        @if (item.subtitle) {
                            <div class="mt-2 text-white/85" style="font: var(--type-caption)">
                                {{ item.subtitle }}
                            </div>
                        }
                    </div>
                </li>
            }
        </ul>
    `,
    styles: `
        /* < 400px — 1 в ряд; 400–1000px — 2 в ряд; ≥ 1000px — все 4 в строку. */
        .bh-feature-grid {
            grid-template-columns: 1fr;
        }
        @media (min-width: 400px) {
            .bh-feature-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        @media (min-width: 1000px) {
            .bh-feature-grid {
                grid-template-columns: repeat(4, 1fr);
            }
        }
        /* Иконка преимущества — в 2 раза крупнее дефолтных 24px. */
        .bh-feature-icon.mat-icon {
            width: 48px;
            height: 48px;
            font-size: 48px;
            line-height: 48px;
        }
    `,
})
export class FeatureBarComponent {
    readonly items = input<FeatureItem[]>([]);
}
