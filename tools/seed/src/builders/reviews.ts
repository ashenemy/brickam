import { COLLECTIONS, type SeedRecord } from '../types';
import { BUYERS, buyerUserId } from './users';

/**
 * Заготовка отзыва: индексами ссылается на товар/вендора/покупателя, чтобы
 * билдер развернул их в стабильные id и денормализовал привязки.
 */
type ReviewSeed = {
    n: number; // порядковый номер (для invoiceNumber-подобного уникального ключа)
    productSlug: string;
    vendorSlug: string;
    buyerIndex: number;
    rating: number;
    text: string;
};

/** Отзывы по нескольким товарам/вендорам (rating 1–5, status published). */
const REVIEWS: ReviewSeed[] = [
    {
        n: 1,
        productSlug: 'cement-m500-standard',
        vendorSlug: 'shin-market',
        buyerIndex: 0,
        rating: 5,
        text: 'Отличный цемент, схватывается быстро. Рекомендую.',
    },
    {
        n: 2,
        productSlug: 'cement-m500-standard',
        vendorSlug: 'shin-market',
        buyerIndex: 1,
        rating: 4,
        text: 'Качество хорошее, но мешки иногда подмокшие.',
    },
    {
        n: 3,
        productSlug: 'ceramic-tile-standard',
        vendorSlug: 'ararat-shinanyut',
        buyerIndex: 2,
        rating: 5,
        text: 'Плитка ровная, цвет как на фото. Доволен.',
    },
    {
        n: 4,
        productSlug: 'faucet-kitchen-pro',
        vendorSlug: 'erevan-stroy',
        buyerIndex: 3,
        rating: 4,
        text: 'Смеситель крепкий, поставили без проблем.',
    },
    {
        n: 5,
        productSlug: 'laminate-32-premium',
        vendorSlug: 'kashen-build',
        buyerIndex: 0,
        rating: 5,
        text: 'Ламинат отличный, замки держат хорошо.',
    },
    {
        n: 6,
        productSlug: 'laminate-32-premium',
        vendorSlug: 'kashen-build',
        buyerIndex: 4,
        rating: 3,
        text: 'Нормально, но доставка задержалась на день.',
    },
    {
        n: 7,
        productSlug: 'paint-water-eco',
        vendorSlug: 'gyumri-shin',
        buyerIndex: 1,
        rating: 5,
        text: 'Краска ложится ровно, без запаха. Беру ещё.',
    },
    {
        n: 8,
        productSlug: 'cable-vvg-master',
        vendorSlug: 'masis-materials',
        buyerIndex: 2,
        rating: 4,
        text: 'Кабель соответствует сечению, медь хорошая.',
    },
    {
        n: 9,
        productSlug: 'drywall-sheet-classic',
        vendorSlug: 'vanadzor-prof',
        buyerIndex: 3,
        rating: 5,
        text: 'Листы целые, без сколов. Спасибо за упаковку.',
    },
    {
        n: 10,
        productSlug: 'tool-drill-pro',
        vendorSlug: 'remont-plus',
        buyerIndex: 0,
        rating: 4,
        text: 'Дрель мощная, патрон удобный.',
    },
    {
        n: 11,
        productSlug: 'cement-m500-pro',
        vendorSlug: 'erevan-stroy',
        buyerIndex: 4,
        rating: 5,
        text: 'Лучший цемент по цене. Заказываю не первый раз.',
    },
    {
        n: 12,
        productSlug: 'putty-finish-lux',
        vendorSlug: 'kashen-build',
        buyerIndex: 1,
        rating: 4,
        text: 'Шпаклёвка тянется хорошо, шлифуется легко.',
    },
];

/**
 * Агрегаты рейтинга по сущностям (productSlug / vendorSlug → {avg, count}).
 * Возвращаются вместе с записями отзывов, чтобы dataset согласованно проставил
 * ratingAvg/ratingCount товарам и вендорам.
 */
export type RatingAggregates = {
    byProductSlug: Map<string, { avg: number; count: number }>;
    byVendorSlug: Map<string, { avg: number; count: number }>;
};

function aggregate(keys: (r: ReviewSeed) => string): Map<string, { avg: number; count: number }> {
    const sums = new Map<string, { sum: number; count: number }>();
    for (const r of REVIEWS) {
        const k = keys(r);
        const cur = sums.get(k) ?? { sum: 0, count: 0 };
        cur.sum += r.rating;
        cur.count += 1;
        sums.set(k, cur);
    }
    const out = new Map<string, { avg: number; count: number }>();
    for (const [k, v] of sums) {
        // Округление до 1 знака, детерминированно.
        out.set(k, { avg: Math.round((v.sum / v.count) * 10) / 10, count: v.count });
    }
    return out;
}

export function computeRatingAggregates(): RatingAggregates {
    return {
        byProductSlug: aggregate((r) => r.productSlug),
        byVendorSlug: aggregate((r) => r.vendorSlug),
    };
}

/**
 * Документы отзывов. vendorOrderId — стабильный уникальный ключ (демо-значение),
 * orderId денормализован. Привязки product/vendor/buyer ссылаются на
 * существующие сущности (см. тест целостности).
 */
export function buildReviews(): SeedRecord[] {
    return REVIEWS.map((r) => {
        const buyer = BUYERS[r.buyerIndex] as { phone: string };
        const vendorOrderId = `vo_seed_${r.n}`;
        return {
            collection: COLLECTIONS.reviews,
            key: { vendorOrderId },
            doc: {
                _id: `review_${r.n}`,
                orderId: `order_seed_${r.n}`,
                vendorOrderId,
                buyerId: buyerUserId(buyer.phone),
                vendorId: `vendor_${r.vendorSlug}`,
                productId: `prod_${r.productSlug}`,
                rating: r.rating,
                text: r.text,
                status: 'published',
            },
        };
    });
}

/** Slug-и сущностей, на которые ссылаются отзывы — для теста целостности. */
export const REVIEWED_PRODUCT_SLUGS = REVIEWS.map((r) => r.productSlug);
export const REVIEWED_VENDOR_SLUGS = REVIEWS.map((r) => r.vendorSlug);
export const REVIEW_BUYER_INDEXES = REVIEWS.map((r) => r.buyerIndex);
