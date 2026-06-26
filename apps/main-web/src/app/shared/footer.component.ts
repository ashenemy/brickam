import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '@brickam/i18n-kit/browser';

/**
 * Подвал публичного сайта: ссылки на CMS-страницы (/p/about, /p/terms, /p/privacy)
 * и копирайт. Шапку не дублирует (переключатели языка/валюты — в навбаре).
 * Подписи локализованы через footer.* с фолбэком на дефолтные строки.
 */
@Component({
    selector: 'app-footer',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink],
    template: `
        <footer
            class="mt-auto bg-bg-deep px-6 py-8 sm:px-12"
            style="border-radius: var(--radius-xl) var(--radius-xl) 0 0"
        >
            <nav
                class="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8"
                style="font: var(--type-caption)"
            >
                @for (link of links(); track link.slug) {
                    <a
                        [routerLink]="['/p', link.slug]"
                        [attr.data-testid]="'footer-' + link.slug"
                        class="text-text-secondary hover:text-accent transition-colors duration-base cursor-pointer rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                        >{{ link.label }}</a
                    >
                }
            </nav>

            <div class="mt-6 text-center text-text-tertiary" style="font: var(--type-meta)">
                {{ copyright() }}
            </div>
        </footer>
    `,
})
export class FooterComponent {
    private readonly i18n = inject(LanguageService);
    protected readonly lang = this.i18n.lang;

    protected readonly links = computed(() => {
        // lang() в зависимостях, чтобы подписи реагировали на смену языка.
        this.lang();
        return [
            { slug: 'about', label: this.ph('about') },
            { slug: 'terms', label: this.ph('terms') },
            { slug: 'privacy', label: this.ph('privacy') },
        ];
    });

    protected readonly copyright = computed(() => {
        this.lang();
        const year = new Date().getFullYear();
        return `© ${year} Brickam. ${this.ph('rights')}`;
    });

    protected ph(key: string): string {
        const full = `footer.${key}`;
        const translated = this.i18n.t(full);
        if (translated !== full) {
            return translated;
        }
        return DEFAULTS[key] ?? key;
    }
}

const DEFAULTS: Record<string, string> = {
    about: 'About',
    terms: 'Terms of use',
    privacy: 'Privacy policy',
    rights: 'All rights reserved.',
};
