import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BadgeComponent, ButtonComponent, FeatureBarComponent } from '@brickam/ui-kit';

@Component({
    selector: 'app-home',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonComponent, BadgeComponent, FeatureBarComponent],
    template: `
        <section class="flex flex-col gap-6">
            <div class="flex flex-col gap-4">
                <h1 class="text-text-primary" style="font: var(--type-hero)">Build smarter with BRICK</h1>
                <p class="text-text-secondary max-w-content">
                    Маркетплейс стройматериалов Армении — десятки проверенных продавцов, доставка за 48 часов.
                </p>
                <div class="flex flex-wrap items-center gap-3">
                    <bh-button variant="primary">Shop now</bh-button>
                    <bh-button variant="secondary">Browse catalog</bh-button>
                    <bh-badge tone="success">50 000+ products</bh-badge>
                </div>
            </div>
            <bh-feature-bar />
        </section>
    `,
})
export class HomeComponent {}
