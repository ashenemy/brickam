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
                'Brickam-ը շինանյութերի առցանց շուկա է Հայաստանում։ Մենք միավորում ենք ' +
                'վաճառողներին և գնորդներին մեկ հարթակում։\n\n' +
                'Այս տեքստը նախնական է. սեփականատերը կթարմացնի այն ադմին վահանակից։',
            ru:
                'Brickam — это онлайн-маркетплейс строительных материалов в Армении. Мы объединяем ' +
                'продавцов и покупателей на одной платформе.\n\n' +
                'Этот текст является заготовкой и будет отредактирован владельцем через админку.',
            en:
                'Brickam is an online marketplace for construction materials in Armenia. We bring ' +
                'sellers and buyers together on a single platform.\n\n' +
                'This text is a placeholder and will be edited by the owner via the admin panel.',
        },
        seoTitle: {
            hy: 'Մեր մասին — Brickam',
            ru: 'О компании — Brickam',
            en: 'About us — Brickam',
        },
        seoDescription: {
            hy: 'Brickam շինանյութերի շուկայի մասին տեղեկություն։',
            ru: 'Информация о маркетплейсе строительных материалов Brickam.',
            en: 'Information about the Brickam construction materials marketplace.',
        },
    },
    {
        slug: 'terms',
        title: { hy: 'Օգտագործման պայմաններ', ru: 'Условия использования', en: 'Terms of Use' },
        content: {
            hy:
                'Օգտվելով Brickam հարթակից՝ դուք համաձայնում եք սույն պայմաններին։\n\n' +
                'Սույն փաստաթուղթը նկարագրում է կողմերի իրավունքներն ու պարտականությունները։\n\n' +
                'Տեքստը նախնական է և կթարմացվի սեփականատիրոջ կողմից։',
            ru:
                'Используя платформу Brickam, вы соглашаетесь с настоящими условиями.\n\n' +
                'Настоящий документ описывает права и обязанности сторон.\n\n' +
                'Текст является заготовкой и будет обновлён владельцем.',
            en:
                'By using the Brickam platform, you agree to these terms.\n\n' +
                'This document describes the rights and obligations of the parties.\n\n' +
                'The text is a placeholder and will be updated by the owner.',
        },
        seoTitle: {
            hy: 'Օգտագործման պայմաններ — Brickam',
            ru: 'Условия использования — Brickam',
            en: 'Terms of Use — Brickam',
        },
        seoDescription: {
            hy: 'Brickam հարթակից օգտվելու պայմանները։',
            ru: 'Условия использования платформы Brickam.',
            en: 'Terms of use for the Brickam platform.',
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
            hy: 'Գաղտնիության քաղաքականություն — Brickam',
            ru: 'Политика конфиденциальности — Brickam',
            en: 'Privacy Policy — Brickam',
        },
        seoDescription: {
            hy: 'Թե ինչպես է Brickam-ը մշակում անձնական տվյալները։',
            ru: 'Как Brickam обрабатывает персональные данные.',
            en: 'How Brickam processes personal data.',
        },
    },
    {
        slug: 'partner',
        title: { hy: 'Դառնալ գործընկեր', ru: 'Стать партнёром', en: 'Become a partner' },
        content: {
            hy:
                'Վաճառեք ձեր շինանյութերը Brickam-ում և հասեք հազարավոր գնորդների ողջ Հայաստանում։\n\n' +
                'Գրանցվեք որպես վաճառող, ավելացրեք ապրանքներ և ստացեք պատվերներ ' +
                'միասնական հարթակից։ Հանձնաժողովը գանձվում է միայն վաճառքից։\n\n' +
                'Տեքստը նախնական է և կթարմացվի սեփականատիրոջ կողմից։',
            ru:
                'Продавайте свои стройматериалы на Brickam и получайте доступ к тысячам покупателей ' +
                'по всей Армении.\n\n' +
                'Зарегистрируйтесь как продавец, добавьте товары и принимайте заказы на единой ' +
                'платформе. Комиссия берётся только с продаж.\n\n' +
                'Этот текст является заготовкой и будет обновлён владельцем.',
            en:
                'Sell your construction materials on Brickam and reach thousands of buyers across ' +
                'Armenia.\n\n' +
                'Register as a seller, add products and accept orders on a single platform. ' +
                'Commission is charged only on sales.\n\n' +
                'This text is a placeholder and will be updated by the owner.',
        },
        seoTitle: {
            hy: 'Դառնալ գործընկեր — Brickam',
            ru: 'Стать партнёром — Brickam',
            en: 'Become a partner — Brickam',
        },
        seoDescription: {
            hy: 'Վաճառեք շինանյութեր Brickam-ում որպես գործընկեր։',
            ru: 'Продавайте стройматериалы на Brickam как партнёр.',
            en: 'Sell construction materials on Brickam as a partner.',
        },
    },
    {
        slug: 'delivery',
        title: { hy: 'Առաքում', ru: 'Доставка', en: 'Delivery' },
        content: {
            hy:
                'Առաքումն իրականացվում է ողջ Հայաստանում սովորաբար 48 ժամվա ընթացքում։\n\n' +
                'Արժեքն ու ժամկետները կախված են վաճառողից, ծավալից և տարածաշրջանից և ' +
                'ցուցադրվում են պատվերը ձևակերպելիս։\n\n' +
                'Տեքստը նախնական է և կթարմացվի սեփականատիրոջ կողմից։',
            ru:
                'Доставка осуществляется по всей Армении, как правило, в течение 48 часов.\n\n' +
                'Стоимость и сроки зависят от продавца, объёма и региона и показываются ' +
                'при оформлении заказа.\n\n' +
                'Этот текст является заготовкой и будет обновлён владельцем.',
            en:
                'Delivery is available across Armenia, usually within 48 hours.\n\n' +
                'Cost and timing depend on the seller, volume and region and are shown ' +
                'at checkout.\n\n' +
                'This text is a placeholder and will be updated by the owner.',
        },
        seoTitle: {
            hy: 'Առաքում — Brickam',
            ru: 'Доставка — Brickam',
            en: 'Delivery — Brickam',
        },
        seoDescription: {
            hy: 'Brickam-ի առաքման պայմաններն ու ժամկետները։',
            ru: 'Условия и сроки доставки Brickam.',
            en: 'Brickam delivery terms and timing.',
        },
    },
    {
        slug: 'payments',
        title: { hy: 'Վճարում', ru: 'Оплата', en: 'Payments' },
        content: {
            hy:
                'Վճարումն իրականացվում է անվտանգ եղանակով՝ քարտով կամ տեղական վճարային ' +
                'համակարգերով (Idram, Telcell, ArCa)։\n\n' +
                'Մեկ վճարումը ավտոմատ բաշխվում է վաճառողների միջև։ Գումարները պաշտպանված են։\n\n' +
                'Տեքստը նախնական է և կթարմացվի սեփականատիրոջ կողմից։',
            ru:
                'Оплата проходит безопасно — картой или местными платёжными системами ' +
                '(Idram, Telcell, ArCa).\n\n' +
                'Один платёж автоматически распределяется между продавцами. Средства защищены.\n\n' +
                'Этот текст является заготовкой и будет обновлён владельцем.',
            en:
                'Payments are secure — by card or local payment systems (Idram, Telcell, ArCa).\n\n' +
                'A single payment is automatically split between sellers. Funds are protected.\n\n' +
                'This text is a placeholder and will be updated by the owner.',
        },
        seoTitle: {
            hy: 'Վճարում — Brickam',
            ru: 'Оплата — Brickam',
            en: 'Payments — Brickam',
        },
        seoDescription: {
            hy: 'Brickam-ում վճարման եղանակներն ու անվտանգությունը։',
            ru: 'Способы оплаты и безопасность на Brickam.',
            en: 'Payment methods and security on Brickam.',
        },
    },
    {
        slug: 'refunds',
        title: { hy: 'Վերադարձ', ru: 'Возвраты', en: 'Returns' },
        content: {
            hy:
                'Ապրանքը կարող եք վերադարձնել ստանալուց հետո 24 ժամվա ընթացքում՝ պահպանված ' +
                'տեսքի դեպքում։\n\n' +
                'Վերադարձի համար դիմեք վաճառողին պատվերի էջից։ Գումարը վերադարձվում է ' +
                'նույն վճարման եղանակով։\n\n' +
                'Տեքստը նախնական է և կթարմացվի սեփականատիրոջ կողմից։',
            ru:
                'Вы можете вернуть товар в течение 24 часов после получения при сохранении ' +
                'товарного вида.\n\n' +
                'Для возврата обратитесь к продавцу со страницы заказа. Деньги возвращаются ' +
                'тем же способом оплаты.\n\n' +
                'Этот текст является заготовкой и будет обновлён владельцем.',
            en:
                'You can return an item within 24 hours of receipt if it keeps its original ' +
                'condition.\n\n' +
                'To request a return, contact the seller from the order page. Refunds are issued ' +
                'to the original payment method.\n\n' +
                'This text is a placeholder and will be updated by the owner.',
        },
        seoTitle: {
            hy: 'Վերադարձ — Brickam',
            ru: 'Возвраты — Brickam',
            en: 'Returns — Brickam',
        },
        seoDescription: {
            hy: 'Brickam-ում ապրանքների վերադարձի պայմանները։',
            ru: 'Условия возврата товаров на Brickam.',
            en: 'Return policy for products on Brickam.',
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
