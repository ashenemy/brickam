import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

/** Входные данные для установки SEO-метаданных страницы. */
export type SeoMeta = {
    title: string;
    description: string;
    image?: string;
    url?: string;
    /** og:type — по умолчанию 'website'. */
    type?: string;
};

/**
 * SSR-безопасная обёртка над Angular Title/Meta. Ставит document title,
 * meta description и OpenGraph/Twitter-теги. Title/Meta работают и на сервере,
 * поэтому метод можно вызывать из компонентов как на SSR, так и в браузере.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
    private readonly title = inject(Title);
    private readonly meta = inject(Meta);

    /** Устанавливает заголовок и набор мета-тегов для текущей страницы. */
    set(data: SeoMeta): void {
        const type = data.type ?? 'website';

        this.title.setTitle(data.title);
        this.meta.updateTag({ name: 'description', content: data.description });

        this.meta.updateTag({ property: 'og:title', content: data.title });
        this.meta.updateTag({ property: 'og:description', content: data.description });
        this.meta.updateTag({ property: 'og:type', content: type });

        if (data.image) {
            this.meta.updateTag({ property: 'og:image', content: data.image });
        }
        if (data.url) {
            this.meta.updateTag({ property: 'og:url', content: data.url });
        }

        this.meta.updateTag({
            name: 'twitter:card',
            content: data.image ? 'summary_large_image' : 'summary',
        });
    }
}
