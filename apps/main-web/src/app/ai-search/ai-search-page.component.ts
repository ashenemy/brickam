import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LanguageService } from '@brickam/i18n-kit/browser';
import {
    BadgeComponent,
    ButtonComponent,
    type Product,
    ProductCardComponent,
} from '@brickam/ui-kit';
import { CurrencyStore } from '../currency/currency.store';
import { AiSearchApiService } from './ai-search-api.service';
import type { AiHit, AiSearchResult, AiSearchTheme } from './models';

/**
 * Страница AI-поиска «Опишите проект» (route /ai). Свободное описание проекта →
 * тип проекта + темы-аккордеоны с пояснением и сеткой карточек товаров.
 * Standalone + OnPush + signals; SSR-безопасно (запрос только по клику).
 */
@Component({
    selector: 'app-ai-search',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ProductCardComponent, ButtonComponent, BadgeComponent],
    template: `
        <section class="flex flex-col gap-6">
            <header class="flex flex-col gap-2">
                <h1 class="text-text-primary" style="font: var(--type-hero)">{{ t('title') }}</h1>
            </header>

            <!-- Поле ввода -->
            <div class="flex flex-col gap-3">
                <textarea
                    [value]="query()"
                    [placeholder]="t('placeholder')"
                    (input)="onInput($event)"
                    rows="4"
                    aria-label="Describe your project"
                    data-testid="ai-query"
                    class="w-full px-4 py-3 rounded-md border-0 outline-none resize-y bg-[rgb(var(--color-neutral-900)/0.9)] text-text-primary font-input text-16 shadow-[inset_0_0_0_1px_var(--border-subtle),var(--shadow-inset)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                ></textarea>
                <div>
                    <bh-button
                        variant="primary"
                        [disabled]="loading() || query().trim().length === 0"
                        (clicked)="onSearch()"
                        data-testid="ai-search-btn"
                    >
                        {{ loading() ? t('searching') : t('search') }}
                    </bh-button>
                </div>
            </div>

            <!-- Состояния -->
            @if (loading()) {
                <div class="py-12 text-center text-text-secondary" style="font: var(--type-product)">
                    {{ t('searching') }}
                </div>
            } @else if (error()) {
                <div
                    class="py-12 text-center text-danger"
                    style="font: var(--type-product)"
                    data-testid="ai-error"
                >
                    {{ t('error') }}
                </div>
            } @else if (result(); as res) {
                @if (res.themes.length === 0) {
                    <div
                        class="py-12 text-center text-text-secondary"
                        style="font: var(--type-product)"
                        data-testid="ai-empty"
                    >
                        {{ t('nothing') }}
                    </div>
                } @else {
                    <div class="flex flex-col gap-2">
                        <h2
                            class="text-text-secondary"
                            style="font: var(--type-caption)"
                            data-testid="ai-project-type"
                        >
                            {{ t('projectType') }}: {{ res.projectType }}
                        </h2>

                        <!-- Аккордеоны тем -->
                        <div class="flex flex-col gap-3">
                            @for (theme of res.themes; track theme.name; let i = $index) {
                                <div
                                    class="rounded-xl bg-surface-card shadow-panel overflow-hidden"
                                    data-testid="ai-theme"
                                >
                                    <button
                                        type="button"
                                        class="flex w-full items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]"
                                        [attr.aria-expanded]="opened() === i"
                                        (click)="toggle(i)"
                                    >
                                        <span class="flex flex-col gap-2 min-w-0">
                                            <span
                                                class="text-text-primary"
                                                style="font: var(--type-product)"
                                                >{{ theme.name }}</span
                                            >
                                            @if (theme.materialCategories.length) {
                                                <span class="flex flex-wrap gap-1.5">
                                                    @for (
                                                        cat of theme.materialCategories;
                                                        track cat
                                                    ) {
                                                        <bh-badge tone="soft">{{ cat }}</bh-badge>
                                                    }
                                                </span>
                                            }
                                        </span>
                                        <span
                                            class="shrink-0 text-text-secondary"
                                            style="font: var(--type-product)"
                                            aria-hidden="true"
                                            >{{ opened() === i ? '−' : '+' }}</span
                                        >
                                    </button>

                                    @if (opened() === i) {
                                        <div class="px-5 pb-5 flex flex-col gap-4">
                                            @if (theme.explanation) {
                                                <p
                                                    class="text-text-secondary"
                                                    style="font: var(--type-caption)"
                                                >
                                                    {{ theme.explanation }}
                                                </p>
                                            }
                                            @if (cardsFor(theme).length) {
                                                <div
                                                    class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
                                                >
                                                    @for (
                                                        c of cardsFor(theme);
                                                        track c.slug
                                                    ) {
                                                        <bh-product-card
                                                            [product]="c.card"
                                                            [addLabel]="t('toCart')"
                                                            (cardClick)="openProduct(c.slug)"
                                                            (addToCart)="openProduct(c.slug)"
                                                        />
                                                    }
                                                </div>
                                            }
                                        </div>
                                    }
                                </div>
                            }
                        </div>
                    </div>
                }
            }
        </section>
    `,
})
export class AiSearchPageComponent {
    private readonly api = inject(AiSearchApiService);
    private readonly router = inject(Router);
    private readonly i18n = inject(LanguageService);
    private readonly currencyStore = inject(CurrencyStore);

    protected readonly lang = this.i18n.lang;

    protected readonly query = signal('');
    protected readonly loading = signal(false);
    protected readonly error = signal(false);
    protected readonly result = signal<AiSearchResult | undefined>(undefined);
    /** Индекс раскрытого аккордеона (первый раскрыт по умолчанию). */
    protected readonly opened = signal(0);

    protected onInput(event: Event): void {
        this.query.set((event.target as HTMLTextAreaElement).value);
    }

    protected onSearch(): void {
        const q = this.query().trim();
        if (q.length === 0 || this.loading()) {
            return;
        }
        this.loading.set(true);
        this.error.set(false);
        this.result.set(undefined);
        this.api.search(q).subscribe({
            next: (res) => {
                this.result.set(res);
                this.opened.set(0);
                this.loading.set(false);
            },
            error: () => {
                this.result.set(undefined);
                this.error.set(true);
                this.loading.set(false);
            },
        });
    }

    protected toggle(index: number): void {
        this.opened.update((current) => (current === index ? -1 : index));
    }

    protected cardsFor(theme: AiSearchTheme): { slug: string; card: Product }[] {
        // Зависимости от валюты — чтобы цены переформатировались при её смене.
        this.currencyStore.selected();
        this.currencyStore.rates();
        this.lang();
        return theme.products.map((p) => ({ slug: p.slug, card: this.toCard(p) }));
    }

    private toCard(hit: AiHit): Product {
        const lang = this.lang();
        const card: Product = {
            id: hit.id,
            title: hit.title[lang],
            vendor: hit.vendorId || '',
            price: this.currencyStore.format(hit.finalPrice),
            unit: hit.unit,
        };
        const image = hit.cover?.thumbnailUrl ?? hit.cover?.url;
        if (image) {
            card.image = image;
        }
        return card;
    }

    protected openProduct(slug: string): void {
        void this.router.navigate(['/product', slug]);
    }

    // Локализованные подписи с фолбэком на дефолтные строки.
    protected t(key: string): string {
        // Чтение lang() делает подписи реактивными к смене языка.
        void this.lang();
        const full = `ai.${key}`;
        const translated = this.i18n.t(full);
        return translated !== full ? translated : (DEFAULTS[key] ?? key);
    }
}

const DEFAULTS: Record<string, string> = {
    title: 'Describe your project',
    placeholder: 'Describe your project…',
    search: 'Find',
    searching: 'Searching…',
    projectType: 'Project type',
    theme: 'Theme',
    explanation: 'Explanation',
    nothing: 'Nothing found. Try describing your project differently.',
    error: 'Search failed. Please try again.',
    toCart: 'Add to cart',
};
