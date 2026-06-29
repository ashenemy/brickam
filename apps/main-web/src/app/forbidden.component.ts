import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { ButtonComponent } from '@brickam/ui-kit';

@Component({
    selector: 'app-forbidden',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonComponent, RouterLink],
    template: `
        <section class="flex flex-col items-center gap-4 py-16 text-center">
            <h1 class="text-text-primary" style="font: var(--type-hero)">{{ t('title', '403') }}</h1>
            <p class="text-text-secondary" style="font: var(--type-product)">
                {{ t('subtitle', 'This app is available for buyers.') }}
            </p>
            <a routerLink="/"><bh-button variant="ghost">{{ t('home', 'Go home') }}</bh-button></a>
        </section>
    `,
})
export class ForbiddenComponent {
    private readonly i18n = inject(LanguageService);

    protected t(key: string, fallback: string): string {
        const full = `forbidden.${key}`;
        const value = this.i18n.t(full);
        return value === full ? fallback : value;
    }
}
