import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BadgeComponent, ButtonComponent } from '@brickam/ui-kit';

@Component({
    selector: 'app-home',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonComponent, BadgeComponent],
    template: `
        <section class="flex flex-col gap-6">
            <h1 class="text-text-primary" style="font: var(--type-display)">Admin console</h1>
            <p class="text-text-secondary">Модерация продавцов, товаров и платформенных настроек.</p>
            <div class="flex flex-wrap items-center gap-3">
                <bh-button variant="primary">Pending vendors</bh-button>
                <bh-button variant="secondary">Catalog moderation</bh-button>
                <bh-badge tone="accent">Admin</bh-badge>
            </div>
        </section>
    `,
})
export class HomeComponent {}
