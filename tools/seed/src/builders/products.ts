import { COLLECTIONS, type LocalizedText, type SeedRecord } from '../types';
import { categoryId } from './categories';
import { VENDORS, vendorId } from './vendors';

/** Стабильный id товара из slug. */
export const productId = (slug: string): string => `prod_${slug}`;

type ProductTemplate = {
    /** Базовый slug-стем (к нему добавляется индекс варианта). */
    stem: string;
    categorySlug: string;
    title: LocalizedText;
    description: LocalizedText;
    unit: string;
    /** Базовая цена в AMD (целая, реалистичная). */
    basePrice: number;
    attributes: { key: string; value: string }[];
};

/**
 * Шаблоны товаров по листовым категориям. Каждый шаблон разворачивается в
 * несколько вариантов (бренды) — так набираем 80–150 товаров детерминированно.
 */
const TEMPLATES: ProductTemplate[] = [
    {
        stem: 'cement-m500',
        categorySlug: 'cement',
        title: { hy: 'Ցemենտ M500', ru: 'Цемент М500', en: 'Cement M500' },
        description: {
            hy: 'Պորտլանդ ցemենտ M500, 50 կգ պարկ, շինարարական աշխատանքների համար:',
            ru: 'Портландцемент М500, мешок 50 кг, для строительных работ.',
            en: 'Portland cement M500, 50 kg bag, for construction works.',
        },
        unit: 'bag',
        basePrice: 4200,
        attributes: [
            { key: 'weight', value: '50kg' },
            { key: 'grade', value: 'M500' },
        ],
    },
    {
        stem: 'putty-finish',
        categorySlug: 'putty',
        title: { hy: 'Ֆինիշային մածիկ', ru: 'Шпаклёвка финишная', en: 'Finish putty' },
        description: {
            hy: 'Ֆինիշային գիպսային մածիկ ներքին աշխատանքների համար, 25 կգ:',
            ru: 'Финишная гипсовая шпаклёвка для внутренних работ, 25 кг.',
            en: 'Gypsum finish putty for interior works, 25 kg.',
        },
        unit: 'bag',
        basePrice: 5600,
        attributes: [
            { key: 'weight', value: '25kg' },
            { key: 'type', value: 'gypsum' },
        ],
    },
    {
        stem: 'plaster-gypsum',
        categorySlug: 'plaster',
        title: { hy: 'Գիպսային սվաղ', ru: 'Штукатурка гипсовая', en: 'Gypsum plaster' },
        description: {
            hy: 'Գիպսային սվաղ ձեռքով կիրառման համար, 30 կգ պարկ:',
            ru: 'Гипсовая штукатурка для ручного нанесения, мешок 30 кг.',
            en: 'Gypsum plaster for manual application, 30 kg bag.',
        },
        unit: 'bag',
        basePrice: 4900,
        attributes: [{ key: 'weight', value: '30kg' }],
    },
    {
        stem: 'ceramic-tile',
        categorySlug: 'tiles',
        title: { hy: 'Կերամիկական սալիկ', ru: 'Плитка керамическая', en: 'Ceramic tile' },
        description: {
            hy: 'Պատի կերամիկական սալիկ 30x60 սմ, փայլուն մակերես:',
            ru: 'Настенная керамическая плитка 30x60 см, глянцевая поверхность.',
            en: 'Wall ceramic tile 30x60 cm, glossy surface.',
        },
        unit: 'm2',
        basePrice: 7800,
        attributes: [
            { key: 'size', value: '30x60' },
            { key: 'surface', value: 'glossy' },
        ],
    },
    {
        stem: 'wallpaper-vinyl',
        categorySlug: 'wallpaper',
        title: { hy: 'Վինիլային պաստառ', ru: 'Обои виниловые', en: 'Vinyl wallpaper' },
        description: {
            hy: 'Վինիլային պաստառ ֆլիզելինային հիմքով, 1.06x10 մ ռուլոն:',
            ru: 'Виниловые обои на флизелиновой основе, рулон 1.06x10 м.',
            en: 'Vinyl wallpaper on non-woven base, 1.06x10 m roll.',
        },
        unit: 'pcs',
        basePrice: 6500,
        attributes: [{ key: 'roll', value: '1.06x10m' }],
    },
    {
        stem: 'faucet-kitchen',
        categorySlug: 'faucets',
        title: { hy: 'Խոհանոցի ծորակ', ru: 'Смеситель кухонный', en: 'Kitchen faucet' },
        description: {
            hy: 'Խոհանոցի ծորակ բարձր ծորակով, քրոմապատ:',
            ru: 'Кухонный смеситель с высоким изливом, хромированный.',
            en: 'Kitchen faucet with high spout, chrome-plated.',
        },
        unit: 'pcs',
        basePrice: 18500,
        attributes: [
            { key: 'material', value: 'brass' },
            { key: 'finish', value: 'chrome' },
        ],
    },
    {
        stem: 'pipe-ppr',
        categorySlug: 'pipes',
        title: { hy: 'PPR խողովակ', ru: 'Труба PPR', en: 'PPR pipe' },
        description: {
            hy: 'Պոլիպրոպիլենային խողովակ ջրամատակարարման համար, D20, 4 մ:',
            ru: 'Полипропиленовая труба для водоснабжения, D20, 4 м.',
            en: 'Polypropylene pipe for water supply, D20, 4 m.',
        },
        unit: 'pcs',
        basePrice: 1350,
        attributes: [{ key: 'diameter', value: '20mm' }],
    },
    {
        stem: 'cable-vvg',
        categorySlug: 'cables',
        title: { hy: 'ВВГ մալուխ', ru: 'Кабель ВВГ', en: 'VVG cable' },
        description: {
            hy: 'Պղնձե ВВГ մալուխ 3x2.5, ներքին էլեկտրագծերի համար:',
            ru: 'Медный кабель ВВГ 3x2.5 для внутренней проводки.',
            en: 'Copper VVG cable 3x2.5 for indoor wiring.',
        },
        unit: 'm',
        basePrice: 920,
        attributes: [
            { key: 'section', value: '3x2.5' },
            { key: 'material', value: 'copper' },
        ],
    },
    {
        stem: 'socket-double',
        categorySlug: 'sockets',
        title: { hy: 'Կրկնակի վարդակ', ru: 'Розетка двойная', en: 'Double socket' },
        description: {
            hy: 'Կրկնակի վարդակ հողանցումով, ներկառուցվող:',
            ru: 'Розетка двойная с заземлением, встраиваемая.',
            en: 'Double socket with grounding, flush-mounted.',
        },
        unit: 'pcs',
        basePrice: 2400,
        attributes: [{ key: 'grounding', value: 'yes' }],
    },
    {
        stem: 'laminate-32',
        categorySlug: 'laminate',
        title: { hy: 'Լամինատ 32 դաս', ru: 'Ламинат 32 класс', en: 'Laminate class 32' },
        description: {
            hy: 'Լամինատ 32 դասի, 8 մմ, կաղնու դեկոր:',
            ru: 'Ламинат 32 класс, 8 мм, декор дуб.',
            en: 'Laminate class 32, 8 mm, oak decor.',
        },
        unit: 'm2',
        basePrice: 5400,
        attributes: [
            { key: 'class', value: '32' },
            { key: 'thickness', value: '8mm' },
        ],
    },
    {
        stem: 'linoleum-comm',
        categorySlug: 'linoleum',
        title: {
            hy: 'Կոմերցիոն լինոլեում',
            ru: 'Линолеум коммерческий',
            en: 'Commercial linoleum',
        },
        description: {
            hy: 'Կոմերցիոն լինոլեում բարձր անցունակության համար, 3 մ լայնք:',
            ru: 'Коммерческий линолеум для высокой проходимости, ширина 3 м.',
            en: 'Commercial linoleum for high traffic, 3 m width.',
        },
        unit: 'm2',
        basePrice: 3900,
        attributes: [{ key: 'width', value: '3m' }],
    },
    {
        stem: 'paint-water',
        categorySlug: 'paints',
        title: { hy: 'Ջրադիսպերս ներկ', ru: 'Краска водно-дисперсионная', en: 'Water-based paint' },
        description: {
            hy: 'Ջրադիսպերս ներկ ներքին պատերի համար, 10 լ, սպիտակ:',
            ru: 'Водно-дисперсионная краска для внутренних стен, 10 л, белая.',
            en: 'Water-based paint for interior walls, 10 L, white.',
        },
        unit: 'L',
        basePrice: 12800,
        attributes: [
            { key: 'volume', value: '10L' },
            { key: 'base', value: 'water' },
        ],
    },
    {
        stem: 'drywall-sheet',
        categorySlug: 'drywall',
        title: { hy: 'Գիպսաստվարաթուղթ', ru: 'Гипсокартон', en: 'Drywall sheet' },
        description: {
            hy: 'Գիպսաստվարաթղթի թերթ 1200x2500x12.5 մմ, ստանդարտ:',
            ru: 'Лист гипсокартона 1200x2500x12.5 мм, стандартный.',
            en: 'Drywall sheet 1200x2500x12.5 mm, standard.',
        },
        unit: 'pcs',
        basePrice: 3300,
        attributes: [
            { key: 'thickness', value: '12.5mm' },
            { key: 'type', value: 'standard' },
        ],
    },
    {
        stem: 'tool-drill',
        categorySlug: 'tools',
        title: { hy: 'Հարվածային գայլիկոն', ru: 'Дрель ударная', en: 'Impact drill' },
        description: {
            hy: 'Հարվածային գայլիկոն 750 Վտ, պատրոն 13 մմ:',
            ru: 'Ударная дрель 750 Вт, патрон 13 мм.',
            en: 'Impact drill 750 W, 13 mm chuck.',
        },
        unit: 'pcs',
        basePrice: 21500,
        attributes: [
            { key: 'power', value: '750W' },
            { key: 'chuck', value: '13mm' },
        ],
    },
];

/** Бренды-варианты: каждый шаблон множится на этот список. */
const BRANDS = ['Standard', 'Pro', 'Premium', 'Lux', 'Eco', 'Master', 'Optima', 'Classic'];

const COVER_VIDEO_EVERY = 8; // ~12.5% обложек — видео
const DISCOUNT_EVERY_PERCENT = 4; // каждый 4-й — percent (~25%)
const DISCOUNT_EVERY_AMOUNT = 7; // каждый 7-й — amount (доп. часть со скидкой)

/**
 * Детерминированно генерирует товары (без Math.random/Date.now). Скидки и
 * видео-обложки распределены по индексу, бренды/вендоры — по модулю, чтобы
 * каждый товар привязывался к существующим vendorId+categoryId.
 */
export function buildProducts(): SeedRecord[] {
    const records: SeedRecord[] = [];
    let index = 0;

    for (const tpl of TEMPLATES) {
        for (let b = 0; b < BRANDS.length; b += 1) {
            const brand = BRANDS[b] as string;
            const slug = `${tpl.stem}-${brand.toLowerCase()}`;
            const vendor = VENDORS[index % VENDORS.length] as { slug: string };

            // Цена варьируется по бренду (детерминированно), но остаётся целой.
            const price = tpl.basePrice + b * Math.round(tpl.basePrice * 0.06);

            const isVideo = index % COVER_VIDEO_EVERY === 0;
            const cover = isVideo
                ? {
                      mediaType: 'video',
                      url: `https://cdn.buildhub.am/products/${slug}/cover.mp4`,
                      thumbnailUrl: `https://cdn.buildhub.am/products/${slug}/cover.jpg`,
                  }
                : {
                      mediaType: 'image',
                      url: `https://cdn.buildhub.am/products/${slug}/cover.jpg`,
                  };

            let discount: Record<string, unknown> | undefined;
            if (index % DISCOUNT_EVERY_PERCENT === 0 && index > 0) {
                discount = { type: 'percent', value: 10 + (index % 3) * 5 };
            } else if (index % DISCOUNT_EVERY_AMOUNT === 0 && index > 0) {
                discount = { type: 'amount', value: Math.round(price * 0.05) };
            }

            const title: LocalizedText = {
                hy: `${tpl.title.hy} «${brand}»`,
                ru: `${tpl.title.ru} «${brand}»`,
                en: `${tpl.title.en} "${brand}"`,
            };

            const doc: Record<string, unknown> = {
                _id: productId(slug),
                vendorId: vendorId(vendor.slug),
                categoryId: categoryId(tpl.categorySlug),
                slug,
                title,
                description: tpl.description,
                cover,
                gallery: [
                    {
                        mediaType: 'image',
                        url: `https://cdn.buildhub.am/products/${slug}/g1.jpg`,
                    },
                ],
                price,
                unit: tpl.unit,
                stock: 25 + ((index * 7) % 200),
                region: 'Yerevan',
                status: 'active',
                attributes: [...tpl.attributes, { key: 'brand', value: brand }],
                ratingAvg: 0,
                ratingCount: 0,
                viewsCount: (index * 13) % 500,
            };
            if (discount !== undefined) {
                doc['discount'] = discount;
            }

            records.push({
                collection: COLLECTIONS.products,
                key: { slug },
                doc,
            });
            index += 1;
        }
    }

    return records;
}
