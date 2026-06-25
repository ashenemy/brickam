import { COLLECTIONS, type LocalizedText, type SeedRecord } from '../types';

/** Стабильный id страницы из slug (идемпотентность сидера). */
export const pageId = (slug: string): string => `page_${slug}`;

type PageTemplate = {
    slug: string;
    title: LocalizedText;
    content: LocalizedText;
    seoTitle: LocalizedText;
    seoDescription: LocalizedText;
};

/**
 * Легальные/информационные CMS-страницы (Foundations §15). Бойлерплейт-текст —
 * плейсхолдер, владелец редактирует через админку. Все три языка (hy/ru/en),
 * статус published — чтобы попадали в публичный листинг и sitemap сразу.
 */
const PAGES: PageTemplate[] = [
    {
        slug: 'about',
        title: { hy: 'Մեր մասին', ru: 'О компании', en: 'About us' },
        content: {
            hy:
                'BuildHub-ը շինանյութերի առցանց շուկա է Հայաստանում։ Մենք միավորում ենք ' +
                'վաճառողներին և գնորդներին մեկ հարթակում։\n\n' +
                'Այս տեքստը նախնական է. սեփականատերը կթարմացնի այն ադմին վահանակից։',
            ru:
                'BuildHub — это онлайн-маркетплейс строительных материалов в Армении. Мы объединяем ' +
                'продавцов и покупателей на одной платформе.\n\n' +
                'Этот текст является заготовкой и будет отредактирован владельцем через админку.',
            en:
                'BuildHub is an online marketplace for construction materials in Armenia. We bring ' +
                'sellers and buyers together on a single platform.\n\n' +
                'This text is a placeholder and will be edited by the owner via the admin panel.',
        },
        seoTitle: {
            hy: 'Մեր մասին — BuildHub',
            ru: 'О компании — BuildHub',
            en: 'About us — BuildHub',
        },
        seoDescription: {
            hy: 'BuildHub շինանյութերի շուկայի մասին տեղեկություն։',
            ru: 'Информация о маркетплейсе строительных материалов BuildHub.',
            en: 'Information about the BuildHub construction materials marketplace.',
        },
    },
    {
        slug: 'terms',
        title: { hy: 'Օգտագործման պայմաններ', ru: 'Условия использования', en: 'Terms of Use' },
        content: {
            hy:
                'Օգտվելով BuildHub հարթակից՝ դուք համաձայնում եք սույն պայմաններին։\n\n' +
                'Սույն փաստաթուղթը նկարագրում է կողմերի իրավունքներն ու պարտականությունները։\n\n' +
                'Տեքստը նախնական է և կթարմացվի սեփականատիրոջ կողմից։',
            ru:
                'Используя платформу BuildHub, вы соглашаетесь с настоящими условиями.\n\n' +
                'Настоящий документ описывает права и обязанности сторон.\n\n' +
                'Текст является заготовкой и будет обновлён владельцем.',
            en:
                'By using the BuildHub platform, you agree to these terms.\n\n' +
                'This document describes the rights and obligations of the parties.\n\n' +
                'The text is a placeholder and will be updated by the owner.',
        },
        seoTitle: {
            hy: 'Օգտագործման պայմաններ — BuildHub',
            ru: 'Условия использования — BuildHub',
            en: 'Terms of Use — BuildHub',
        },
        seoDescription: {
            hy: 'BuildHub հարթակից օգտվելու պայմանները։',
            ru: 'Условия использования платформы BuildHub.',
            en: 'Terms of use for the BuildHub platform.',
        },
    },
    {
        slug: 'privacy',
        title: {
            hy: 'Գաղտնիության քաղաքականություն',
            ru: 'Политика конфиденциальности',
            en: 'Privacy Policy',
        },
        content: {
            hy:
                'Մենք հարգում ենք ձեր գաղտնիությունը և պաշտպանում ենք ձեր անձնական տվյալները։\n\n' +
                'Սույն քաղաքականությունը նկարագրում է, թե ինչ տվյալներ ենք հավաքում և ինչպես ' +
                'ենք դրանք օգտագործում։\n\n' +
                'Տեքստը նախնական է և կթարմացվի սեփականատիրոջ կողմից։',
            ru:
                'Мы уважаем вашу конфиденциальность и защищаем ваши персональные данные.\n\n' +
                'Настоящая политика описывает, какие данные мы собираем и как их используем.\n\n' +
                'Текст является заготовкой и будет обновлён владельцем.',
            en:
                'We respect your privacy and protect your personal data.\n\n' +
                'This policy describes what data we collect and how we use it.\n\n' +
                'The text is a placeholder and will be updated by the owner.',
        },
        seoTitle: {
            hy: 'Գաղտնիության քաղաքականություն — BuildHub',
            ru: 'Политика конфиденциальности — BuildHub',
            en: 'Privacy Policy — BuildHub',
        },
        seoDescription: {
            hy: 'Թե ինչպես է BuildHub-ը մշակում անձնական տվյալները։',
            ru: 'Как BuildHub обрабатывает персональные данные.',
            en: 'How BuildHub processes personal data.',
        },
    },
];

/**
 * Детерминированно строит датасет легальных CMS-страниц. Ключ upsert — `slug`
 * (как у схемы Page: уникальный индекс), поэтому повторный прогон идемпотентен.
 */
export function buildPages(): SeedRecord[] {
    return PAGES.map((tpl) => ({
        collection: COLLECTIONS.pages,
        key: { slug: tpl.slug },
        doc: {
            _id: pageId(tpl.slug),
            slug: tpl.slug,
            title: tpl.title,
            content: tpl.content,
            status: 'published',
            seoTitle: tpl.seoTitle,
            seoDescription: tpl.seoDescription,
        },
    }));
}
