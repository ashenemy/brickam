import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LogoComponent } from '../core/logo.component';

/**
 * Footer — ряд соцсетей, скачивание приложения, юридические ссылки.
 * Лежит на глубоком фоне приложения. Адаптив: flex-wrap, без overflow.
 * Перенесён с React (marketplace/Footer.jsx).
 */
@Component({
    selector: 'bh-footer',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LogoComponent],
    template: `
        <footer
            class="bg-bg-deep px-6 py-10 sm:px-12"
            style="border-radius: var(--radius-xl) var(--radius-xl) 0 0"
        >
            <div class="flex flex-wrap items-center justify-between gap-6">
                <bh-logo [height]="32" />

                <div
                    class="flex flex-wrap items-center gap-3.5 text-text-secondary"
                    style="font: var(--type-caption)"
                >
                    <span>Follow us:</span>
                    @for (social of socials(); track social) {
                        <button
                            type="button"
                            class="inline-flex h-8 w-8 items-center justify-center rounded-pill bg-surface-chip text-text-primary text-12 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                            [attr.title]="social"
                            [attr.aria-label]="social"
                            (click)="socialClick.emit(social)"
                        >
                            {{ social[0] }}
                        </button>
                    }
                </div>

                <div
                    class="flex items-center gap-3 text-text-secondary"
                    style="font: var(--type-caption)"
                >
                    <span>Download the app</span>
                    <span
                        class="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-white"
                        aria-hidden="true"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--color-text-inverse))" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                        </svg>
                    </span>
                </div>
            </div>

            <div class="my-7 h-px bg-[var(--border-subtle)]"></div>

            <nav
                class="flex flex-wrap justify-center gap-8 text-text-secondary"
                aria-label="Legal"
                style="font: var(--type-caption)"
            >
                @for (item of legal(); track item) {
                    <a
                        class="cursor-pointer rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                        href="#"
                        (click)="onLegal($event, item)"
                        >{{ item }}</a
                    >
                }
            </nav>

            <div class="mt-4 text-center text-text-tertiary" style="font: var(--type-meta)">
                {{ copyright() }}
            </div>
        </footer>
    `,
})
export class FooterComponent {
    readonly socials = input<string[]>([
        'Facebook',
        'Instagram',
        'TikTok',
        'X',
        'WhatsApp',
        'YouTube',
        'Telegram',
    ]);
    readonly legal = input<string[]>(['Terms of use', 'Privacy policy', 'Cookie Policy']);
    readonly copyright = input('Copyright © 2025. All rights reserved');

    readonly socialClick = output<string>();
    readonly legalClick = output<string>();

    protected onLegal(event: Event, item: string): void {
        event.preventDefault();
        this.legalClick.emit(item);
    }
}
