import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { BadgeComponent, ButtonComponent, FeatureBarComponent } from '@brickam/ui-kit';
import { SeoService } from './seo/seo.service';

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
export class HomeComponent {
    private readonly i18n = inject(LanguageService);
    private readonly seo = inject(SeoService);

    constructor() {
        // Дефолтные мета сайта; реагируют на смену языка (i18n.lang() — зависимость).
        effect(() => {
            this.i18n.lang();
            const title = this.tr('seo.siteTitle', 'Brickam — Construction materials marketplace');
            const description = this.tr(
                'seo.siteDescription',
                'Brickam — marketplace of construction materials in Armenia. Dozens of trusted vendors, delivery within 48 hours.',
            );
            this.seo.set({ title, description, type: 'website' });
        });
    }

    private tr(key: string, fallback: string): string {
        const value = this.i18n.t(key);
        return value === key ? fallback : value;
    }
}
