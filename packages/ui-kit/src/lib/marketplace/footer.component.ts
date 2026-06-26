import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { LogoComponent } from '../core/logo.component';

/**
 * Footer — соцсети, скачивание приложения, юридические ссылки. Соцкнопки —
 * официальный `matIconButton`, QR/иконки — `mat-icon`. Лежит на глубоком фоне.
 * Адаптив: flex-wrap, без overflow (на мобиле — колонкой).
 */
@Component({
    selector: 'bh-footer',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LogoComponent, MatIconButton, MatIcon],
    template: `
        <footer
            class="bg-bg-deep px-6 py-10 sm:px-12"
            style="border-radius: var(--radius-xl) var(--radius-xl) 0 0"
        >
            <div class="flex flex-wrap items-center justify-between gap-6">
                <bh-logo [height]="32" />

                <div
                    class="flex flex-wrap items-center gap-2 text-text-secondary"
                    style="font: var(--type-caption)"
                >
                    <span>Follow us:</span>
                    @for (social of socials(); track social) {
                        <button
                            matIconButton
                            class="bh-social"
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
                        class="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-white text-text-inverse"
                        aria-hidden="true"
                    >
                        <mat-icon>qr_code_2</mat-icon>
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
    styles: `
        .bh-social.mat-mdc-icon-button {
            width: 32px;
            height: 32px;
            padding: 0;
            border-radius: var(--radius-pill);
            background: rgb(var(--color-surface-chip));
            color: rgb(var(--color-text-primary));
            font-size: var(--fs-12);
            line-height: 32px;
        }
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
