import { COLLECTIONS, type LocalizedText, type SeedRecord } from '../types';
import { categoryId, LEAF_NAMES } from './categories';
import { VENDORS, vendorId } from './vendors';

/** Стабильный id товара из slug. */
export const productId = (slug: string): string => `prod_${slug}`;

/** Метаданные листовой категории для генерации товаров (язык-нейтральные спеки). */
type LeafMeta = { unit: string; basePrice: number; specs: [string, string] };

/**
 * unit/базовая цена/2 спецификации на каждую листовую категорию. Названия товаров
 * берутся из LEAF_NAMES (трёхъязычно) + спека + бренд. Спеки — латиница/числа
 * (размеры/типы), одинаковы во всех языках.
 */
const LEAF_META: Record<string, LeafMeta> = {
    // Building materials
    cement: { unit: 'bag', basePrice: 4200, specs: ['M400', 'M500'] },
    'bricks-blocks': { unit: 'pcs', basePrice: 180, specs: ['Red M150', 'Aerated D500'] },
    aggregates: { unit: 'm3', basePrice: 9500, specs: ['Gravel 5-20', 'Washed sand'] },
    rebar: { unit: 'm', basePrice: 850, specs: ['Ø10', 'Ø12'] },
    insulation: { unit: 'm2', basePrice: 1300, specs: ['Mineral 50mm', 'EPS 50mm'] },
    waterproofing: { unit: 'kg', basePrice: 2100, specs: ['Bitumen', 'Polymer'] },
    // Finishing
    tiles: { unit: 'm2', basePrice: 7800, specs: ['30x60', '60x60'] },
    wallpaper: { unit: 'roll', basePrice: 6500, specs: ['Vinyl 1.06x10', 'Non-woven'] },
    'decorative-plaster': { unit: 'kg', basePrice: 5200, specs: ['Travertine', 'Marseille wax'] },
    panels: { unit: 'm2', basePrice: 3400, specs: ['PVC', 'MDF'] },
    drywall: { unit: 'pcs', basePrice: 3300, specs: ['12.5mm', 'Moisture 12.5mm'] },
    putty: { unit: 'bag', basePrice: 5600, specs: ['Finish 25kg', 'Start 25kg'] },
    plaster: { unit: 'bag', basePrice: 4900, specs: ['Gypsum 30kg', 'Cement 25kg'] },
    // Paints
    'paint-interior': { unit: 'L', basePrice: 12800, specs: ['10L white', '5L white'] },
    'paint-facade': { unit: 'L', basePrice: 14500, specs: ['10L', '5L'] },
    primers: { unit: 'L', basePrice: 4200, specs: ['Deep 10L', 'Contact 5L'] },
    varnishes: { unit: 'L', basePrice: 6800, specs: ['Wood 2.5L', 'Yacht 1L'] },
    'painting-tools': { unit: 'pcs', basePrice: 1800, specs: ['Roller set', 'Brush set'] },
    // Flooring
    laminate: { unit: 'm2', basePrice: 5400, specs: ['Class 32 8mm', 'Class 33 10mm'] },
    linoleum: { unit: 'm2', basePrice: 3900, specs: ['Commercial 3m', 'Household 3m'] },
    parquet: { unit: 'm2', basePrice: 14800, specs: ['Oak', 'Ash'] },
    'vinyl-spc': { unit: 'm2', basePrice: 6900, specs: ['SPC 4mm', 'LVT 3mm'] },
    skirting: { unit: 'pcs', basePrice: 1200, specs: ['PVC 2.5m', 'MDF 2.4m'] },
    // Plumbing
    faucets: { unit: 'pcs', basePrice: 18500, specs: ['Kitchen', 'Basin'] },
    pipes: { unit: 'pcs', basePrice: 1350, specs: ['PPR D20', 'PPR D25'] },
    sinks: { unit: 'pcs', basePrice: 22000, specs: ['Ceramic 60', 'Ceramic 80'] },
    toilets: { unit: 'pcs', basePrice: 48000, specs: ['Floor', 'Wall-hung'] },
    showers: { unit: 'pcs', basePrice: 95000, specs: ['Bathtub 170', 'Cabin 90'] },
    'water-heaters': { unit: 'pcs', basePrice: 62000, specs: ['50L', '80L'] },
    // Electrics
    cables: { unit: 'm', basePrice: 920, specs: ['VVG 3x2.5', 'VVG 3x1.5'] },
    sockets: { unit: 'pcs', basePrice: 2400, specs: ['Double', 'Single'] },
    breakers: { unit: 'pcs', basePrice: 3200, specs: ['C16', 'C25'] },
    fixtures: { unit: 'pcs', basePrice: 8500, specs: ['LED panel 36W', 'Spot 7W'] },
    lamps: { unit: 'pcs', basePrice: 1100, specs: ['LED 9W', 'LED 12W'] },
    // Tools
    'power-tools': { unit: 'pcs', basePrice: 21500, specs: ['Impact drill 750W', 'Grinder 950W'] },
    'hand-tools': { unit: 'pcs', basePrice: 4200, specs: ['Hammer 500g', 'Screwdriver set'] },
    measuring: { unit: 'pcs', basePrice: 6800, specs: ['Laser 50m', 'Tape 5m'] },
    abrasives: { unit: 'pcs', basePrice: 480, specs: ['Cutting 125', 'Flap 125'] },
    // Doors & windows
    'interior-doors': { unit: 'pcs', basePrice: 38000, specs: ['Eco-veneer', 'PVC'] },
    'entrance-doors': { unit: 'pcs', basePrice: 145000, specs: ['Steel', 'Insulated'] },
    windows: { unit: 'pcs', basePrice: 78000, specs: ['PVC 1200x1400', 'PVC 1500x1500'] },
    locks: { unit: 'pcs', basePrice: 6400, specs: ['Mortise', 'Cylinder'] },
    // Heating
    radiators: { unit: 'section', basePrice: 3800, specs: ['Bimetal', 'Aluminium'] },
    boilers: { unit: 'pcs', basePrice: 185000, specs: ['Gas 24kW', 'Electric 9kW'] },
    ventilation: { unit: 'pcs', basePrice: 5200, specs: ['Fan 100', 'Fan 125'] },
    'air-conditioning': { unit: 'pcs', basePrice: 165000, specs: ['9000 BTU', '12000 BTU'] },
    // Garden
    paving: { unit: 'm2', basePrice: 5600, specs: ['Vibro-pressed', 'Granite'] },
    fencing: { unit: 'm2', basePrice: 7200, specs: ['Profiled sheet', 'Mesh 3D'] },
    'garden-tools': { unit: 'pcs', basePrice: 8900, specs: ['Trimmer', 'Lawn mower'] },
    // Fasteners
    screws: { unit: 'pack', basePrice: 1400, specs: ['3.5x35', '4.2x75'] },
    anchors: { unit: 'pack', basePrice: 1800, specs: ['Dowel 6x40', 'Anchor 10x100'] },
    sealants: { unit: 'pcs', basePrice: 2100, specs: ['Silicone', 'Polyurethane'] },
};

/** Бренды-варианты (детерминированно множат каждую спеку). */
const BRANDS = ['Standard', 'Pro', 'Premium', 'Eco', 'Master'];

/** Детерминированный хэш (FNV-1a) — без Math.random/Date.now. */
function hash(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i += 1) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
}

function xmlEscape(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Уникальная SVG-обложка товара как data-URI (хранится прямо в БД, переносится с
 * mongodump, без зависимости от MinIO). Цвет — по хэшу slug; текст — название/спека.
 */
function svgCover(slug: string, label: string, subtitle: string): string {
    const hue = hash(slug) % 360;
    const initials = label.slice(0, 2).toUpperCase();
    const svg =
        `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'>` +
        `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
        `<stop offset='0' stop-color='hsl(${hue},58%,46%)'/>` +
        `<stop offset='1' stop-color='hsl(${(hue + 28) % 360},64%,26%)'/>` +
        `</linearGradient></defs>` +
        `<rect width='600' height='600' fill='url(#g)'/>` +
        `<text x='300' y='340' text-anchor='middle' font-family='Poppins,Arial,sans-serif' font-size='220' font-weight='700' fill='rgba(255,255,255,0.16)'>${xmlEscape(initials)}</text>` +
        `<text x='40' y='524' font-family='Poppins,Arial,sans-serif' font-size='36' font-weight='700' fill='#ffffff'>${xmlEscape(label)}</text>` +
        `<text x='40' y='562' font-family='Arial,sans-serif' font-size='22' fill='rgba(255,255,255,0.82)'>${xmlEscape(subtitle)}</text>` +
        `</svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Детерминированно генерирует ~520 товаров по всем листовым категориям
 * (52 листа × 2 спеки × 5 брендов). Каждый товар — своя SVG-обложка, рейтинг,
 * остаток и вьюшки выводятся из хэша slug. Привязки к существующим vendorId/categoryId.
 */
export function buildProducts(): SeedRecord[] {
    const records: SeedRecord[] = [];
    let index = 0;

    for (const [leaf, meta] of Object.entries(LEAF_META)) {
        const noun = LEAF_NAMES[leaf];
        if (noun === undefined) continue;
        const enLabel = noun.en.split(' & ')[0] as string;

        for (let si = 0; si < meta.specs.length; si += 1) {
            const spec = meta.specs[si] as string;
            for (let b = 0; b < BRANDS.length; b += 1) {
                const brand = BRANDS[b] as string;
                const slug = `${leaf}-s${si + 1}-${brand.toLowerCase()}`;
                const vendor = VENDORS[index % VENDORS.length] as { slug: string };
                const h = hash(slug);

                const price =
                    meta.basePrice +
                    b * Math.round(meta.basePrice * 0.06) +
                    si * Math.round(meta.basePrice * 0.03);

                const title: LocalizedText = {
                    hy: `${noun.hy} ${spec} «${brand}»`,
                    ru: `${noun.ru} ${spec} «${brand}»`,
                    en: `${enLabel} ${spec} "${brand}"`,
                };
                const description: LocalizedText = {
                    hy: `${noun.hy} ${spec}, ${brand}. Որակյալ ապրանք շինարարության համար:`,
                    ru: `${noun.ru} ${spec}, ${brand}. Качественный товар для строительства и ремонта.`,
                    en: `${enLabel} ${spec}, ${brand}. Quality product for construction and renovation.`,
                };

                let discount: Record<string, unknown> | undefined;
                if (index % 4 === 0 && index > 0) {
                    discount = { type: 'percent', value: 10 + (index % 4) * 5 };
                } else if (index % 7 === 0 && index > 0) {
                    discount = { type: 'amount', value: Math.round(price * 0.05) };
                }

                const doc: Record<string, unknown> = {
                    _id: productId(slug),
                    vendorId: vendorId(vendor.slug),
                    categoryId: categoryId(leaf),
                    slug,
                    title,
                    description,
                    cover: {
                        mediaType: 'image',
                        url: svgCover(slug, enLabel, `${brand} • ${spec}`),
                    },
                    gallery: [],
                    price,
                    unit: meta.unit,
                    stock: 10 + (h % 300),
                    region: 'Yerevan',
                    status: 'active',
                    attributes: [
                        { key: 'spec', value: spec },
                        { key: 'brand', value: brand },
                    ],
                    ratingAvg: Math.round((3.6 + (h % 15) / 10) * 10) / 10,
                    ratingCount: 5 + (h % 240),
                    viewsCount: h % 800,
                };
                if (discount !== undefined) {
                    doc['discount'] = discount;
                }

                records.push({ collection: COLLECTIONS.products, key: { slug }, doc });
                index += 1;
            }
        }
    }

    return records;
}
