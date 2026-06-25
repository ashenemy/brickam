import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { BadgeComponent } from '@brickam/ui-kit';
import { LoyaltyStore } from './loyalty.store';

/**
 * Индикатор уровня лояльности в шелле: ссылка на /loyalty + бейдж с названием
 * текущего уровня. Показывается только когда уровень известен (есть currentTier).
 */
@Component({
    selector: 'app-loyalty-badge',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterModule, BadgeComponent],
    template: `
        <a
            href="/loyalty"
            routerLink="/loyalty"
            [attr.aria-label]="label()"
            class="inline-flex items-center text-text-primary hover:text-accent transition-colors duration-base cursor-pointer rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
        >
            @if (tierName(); as name) {
                <bh-badge tone="soft">{{ name }}</bh-badge>
            } @else {
                <span style="font: var(--type-label)">{{ label() }}</span>
            }
        </a>
    `,
})
export class LoyaltyBadgeComponent {
    private readonly store = inject(LoyaltyStore);
    private readonly i18n = inject(LanguageService);

    protected readonly tierName = this.store.tierName;

    protected label(): string {
        const key = 'loyalty.title';
        const translated = this.i18n.t(key);
        return translated !== key ? translated : 'Loyalty';
    }
}
