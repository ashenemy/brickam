import { COLLECTIONS, type LocalizedText, type SeedRecord } from '../types';

/** Стабильный id категории из slug. */
export const categoryId = (slug: string): string => `cat_${slug}`;

type CategorySeed = {
    slug: string;
    name: LocalizedText;
    parentSlug?: string;
    icon?: string;
    order: number;
};

/**
 * Прод-таксономия строительного маркетплейса (Армения), 2 уровня: 11 корней →
 * ~45 листовых подкатегорий. Подкатегории ссылаются на корень через parentSlug.
 * Названия — трёхъязычные (hy дефолт / ru / en). icon — имя Material Symbol.
 */
const ROOTS: CategorySeed[] = [
    {
        slug: 'building',
        name: { hy: 'Շինանյութեր', ru: 'Стройматериалы', en: 'Building materials' },
        icon: 'foundation',
        order: 1,
    },
    {
        slug: 'finishing',
        name: { hy: 'Հարդարման նյութեր', ru: 'Отделочные материалы', en: 'Finishing materials' },
        icon: 'format_paint',
        order: 2,
    },
    {
        slug: 'paints',
        name: { hy: 'Ներկեր և լաքեր', ru: 'Краски и лаки', en: 'Paints & varnishes' },
        icon: 'palette',
        order: 3,
    },
    {
        slug: 'flooring',
        name: { hy: 'Հատակի ծածկույթ', ru: 'Напольные покрытия', en: 'Flooring' },
        icon: 'grid_on',
        order: 4,
    },
    {
        slug: 'plumbing',
        name: { hy: 'Սանտեխնիկա', ru: 'Сантехника', en: 'Plumbing' },
        icon: 'plumbing',
        order: 5,
    },
    {
        slug: 'electrics',
        name: {
            hy: 'Էլեկտրականություն և լուսավորություն',
            ru: 'Электрика и освещение',
            en: 'Electrical & lighting',
        },
        icon: 'bolt',
        order: 6,
    },
    {
        slug: 'tools',
        name: {
            hy: 'Գործիքներ և սարքավորում',
            ru: 'Инструменты и оборудование',
            en: 'Tools & equipment',
        },
        icon: 'handyman',
        order: 7,
    },
    {
        slug: 'doors-windows',
        name: { hy: 'Դռներ և պատուհաններ', ru: 'Двери и окна', en: 'Doors & windows' },
        icon: 'door_front',
        order: 8,
    },
    {
        slug: 'heating',
        name: {
            hy: 'Ջեռուցում և օդափոխություն',
            ru: 'Отопление и вентиляция',
            en: 'Heating & ventilation',
        },
        icon: 'mode_heat',
        order: 9,
    },
    {
        slug: 'garden',
        name: { hy: 'Այգի և արտաքին', ru: 'Сад и экстерьер', en: 'Garden & exterior' },
        icon: 'yard',
        order: 10,
    },
    {
        slug: 'fasteners',
        name: {
            hy: 'Ամրակներ և մետաղական իրեր',
            ru: 'Крепёж и метизы',
            en: 'Fasteners & hardware',
        },
        icon: 'hardware',
        order: 11,
    },
];

const LEAVES: CategorySeed[] = [
    // Building materials
    {
        slug: 'cement',
        parentSlug: 'building',
        name: { hy: 'Ցեմենտ', ru: 'Цемент', en: 'Cement' },
        order: 1,
    },
    {
        slug: 'bricks-blocks',
        parentSlug: 'building',
        name: { hy: 'Աղյուս և բլոկ', ru: 'Кирпич и блоки', en: 'Bricks & blocks' },
        order: 2,
    },
    {
        slug: 'aggregates',
        parentSlug: 'building',
        name: { hy: 'Իներտ նյութեր', ru: 'Бетон и заполнители', en: 'Concrete & aggregates' },
        order: 3,
    },
    {
        slug: 'rebar',
        parentSlug: 'building',
        name: { hy: 'Արմատուր և մետաղ', ru: 'Арматура и металл', en: 'Rebar & metal' },
        order: 4,
    },
    {
        slug: 'insulation',
        parentSlug: 'building',
        name: { hy: 'Ջերմամեկուսացում', ru: 'Теплоизоляция', en: 'Insulation' },
        order: 5,
    },
    {
        slug: 'waterproofing',
        parentSlug: 'building',
        name: { hy: 'Հիդրոմեկուսացում', ru: 'Гидроизоляция', en: 'Waterproofing' },
        order: 6,
    },

    // Finishing materials
    {
        slug: 'tiles',
        parentSlug: 'finishing',
        name: { hy: 'Սալիկ', ru: 'Плитка', en: 'Tiles & ceramics' },
        order: 1,
    },
    {
        slug: 'wallpaper',
        parentSlug: 'finishing',
        name: { hy: 'Պաստառ', ru: 'Обои', en: 'Wallpaper' },
        order: 2,
    },
    {
        slug: 'decorative-plaster',
        parentSlug: 'finishing',
        name: { hy: 'Դեկորատիվ սվաղ', ru: 'Декоративная штукатурка', en: 'Decorative plaster' },
        order: 3,
    },
    {
        slug: 'panels',
        parentSlug: 'finishing',
        name: { hy: 'Պանելներ և մոլդինգ', ru: 'Панели и молдинги', en: 'Panels & moldings' },
        order: 4,
    },
    {
        slug: 'drywall',
        parentSlug: 'finishing',
        name: { hy: 'Գիպսաստվարաթուղթ', ru: 'Гипсокартон и профили', en: 'Drywall & profiles' },
        order: 5,
    },
    {
        slug: 'putty',
        parentSlug: 'finishing',
        name: { hy: 'Մածիկ', ru: 'Шпаклёвка', en: 'Putty' },
        order: 6,
    },
    {
        slug: 'plaster',
        parentSlug: 'finishing',
        name: { hy: 'Գիպս', ru: 'Штукатурка', en: 'Plaster' },
        order: 7,
    },

    // Paints & varnishes
    {
        slug: 'paint-interior',
        parentSlug: 'paints',
        name: { hy: 'Ներքին ներկեր', ru: 'Краски для интерьера', en: 'Interior paints' },
        order: 1,
    },
    {
        slug: 'paint-facade',
        parentSlug: 'paints',
        name: { hy: 'Ֆասադային ներկեր', ru: 'Фасадные краски', en: 'Facade paints' },
        order: 2,
    },
    {
        slug: 'primers',
        parentSlug: 'paints',
        name: { hy: 'Գրունտ', ru: 'Грунтовки', en: 'Primers' },
        order: 3,
    },
    {
        slug: 'varnishes',
        parentSlug: 'paints',
        name: { hy: 'Լաքեր և ներծծուկ', ru: 'Лаки и пропитки', en: 'Varnishes & stains' },
        order: 4,
    },
    {
        slug: 'painting-tools',
        parentSlug: 'paints',
        name: { hy: 'Ներկման գործիքներ', ru: 'Малярный инструмент', en: 'Painting tools' },
        order: 5,
    },

    // Flooring
    {
        slug: 'laminate',
        parentSlug: 'flooring',
        name: { hy: 'Լամինատ', ru: 'Ламинат', en: 'Laminate' },
        order: 1,
    },
    {
        slug: 'linoleum',
        parentSlug: 'flooring',
        name: { hy: 'Լինոլեում', ru: 'Линолеум', en: 'Linoleum' },
        order: 2,
    },
    {
        slug: 'parquet',
        parentSlug: 'flooring',
        name: { hy: 'Մանրահատակ', ru: 'Паркет', en: 'Parquet' },
        order: 3,
    },
    {
        slug: 'vinyl-spc',
        parentSlug: 'flooring',
        name: { hy: 'Վինիլ/SPC', ru: 'Винил/SPC', en: 'Vinyl / SPC' },
        order: 4,
    },
    {
        slug: 'skirting',
        parentSlug: 'flooring',
        name: { hy: 'Պլինտուս', ru: 'Плинтус', en: 'Skirting' },
        order: 5,
    },

    // Plumbing
    {
        slug: 'faucets',
        parentSlug: 'plumbing',
        name: { hy: 'Ծորակներ', ru: 'Смесители', en: 'Faucets & mixers' },
        order: 1,
    },
    {
        slug: 'pipes',
        parentSlug: 'plumbing',
        name: { hy: 'Խողովակներ', ru: 'Трубы и фитинги', en: 'Pipes & fittings' },
        order: 2,
    },
    {
        slug: 'sinks',
        parentSlug: 'plumbing',
        name: { hy: 'Լվացարաններ', ru: 'Раковины', en: 'Sinks & basins' },
        order: 3,
    },
    {
        slug: 'toilets',
        parentSlug: 'plumbing',
        name: { hy: 'Զուգարանակոնքեր', ru: 'Унитазы', en: 'Toilets & bidets' },
        order: 4,
    },
    {
        slug: 'showers',
        parentSlug: 'plumbing',
        name: { hy: 'Լոգարան և ցնցուղ', ru: 'Ванны и душ', en: 'Bathtubs & showers' },
        order: 5,
    },
    {
        slug: 'water-heaters',
        parentSlug: 'plumbing',
        name: { hy: 'Ջրատաքացուցիչներ', ru: 'Водонагреватели', en: 'Water heaters' },
        order: 6,
    },

    // Electrical & lighting
    {
        slug: 'cables',
        parentSlug: 'electrics',
        name: { hy: 'Մալուխներ', ru: 'Кабели и провода', en: 'Cables & wires' },
        order: 1,
    },
    {
        slug: 'sockets',
        parentSlug: 'electrics',
        name: {
            hy: 'Վարդակներ և անջատիչներ',
            ru: 'Розетки и выключатели',
            en: 'Sockets & switches',
        },
        order: 2,
    },
    {
        slug: 'breakers',
        parentSlug: 'electrics',
        name: { hy: 'Ավտոմատներ', ru: 'Автоматы и щиты', en: 'Circuit breakers' },
        order: 3,
    },
    {
        slug: 'fixtures',
        parentSlug: 'electrics',
        name: { hy: 'Լուսատուներ', ru: 'Светильники', en: 'Lighting fixtures' },
        order: 4,
    },
    {
        slug: 'lamps',
        parentSlug: 'electrics',
        name: { hy: 'LED և լամպեր', ru: 'LED и лампы', en: 'LED & lamps' },
        order: 5,
    },

    // Tools & equipment
    {
        slug: 'power-tools',
        parentSlug: 'tools',
        name: { hy: 'Էլեկտրագործիքներ', ru: 'Электроинструмент', en: 'Power tools' },
        order: 1,
    },
    {
        slug: 'hand-tools',
        parentSlug: 'tools',
        name: { hy: 'Ձեռքի գործիքներ', ru: 'Ручной инструмент', en: 'Hand tools' },
        order: 2,
    },
    {
        slug: 'measuring',
        parentSlug: 'tools',
        name: { hy: 'Չափիչ գործիքներ', ru: 'Измерительный инструмент', en: 'Measuring tools' },
        order: 3,
    },
    {
        slug: 'abrasives',
        parentSlug: 'tools',
        name: { hy: 'Աբրազիվներ և սկավառակներ', ru: 'Абразивы и диски', en: 'Abrasives & discs' },
        order: 4,
    },

    // Doors & windows
    {
        slug: 'interior-doors',
        parentSlug: 'doors-windows',
        name: { hy: 'Ներքին դռներ', ru: 'Межкомнатные двери', en: 'Interior doors' },
        order: 1,
    },
    {
        slug: 'entrance-doors',
        parentSlug: 'doors-windows',
        name: { hy: 'Մուտքի դռներ', ru: 'Входные двери', en: 'Entrance doors' },
        order: 2,
    },
    {
        slug: 'windows',
        parentSlug: 'doors-windows',
        name: { hy: 'Պատուհաններ', ru: 'Окна', en: 'Windows' },
        order: 3,
    },
    {
        slug: 'locks',
        parentSlug: 'doors-windows',
        name: { hy: 'Կողպեքներ և պարագաներ', ru: 'Замки и фурнитура', en: 'Hardware & locks' },
        order: 4,
    },

    // Heating & ventilation
    {
        slug: 'radiators',
        parentSlug: 'heating',
        name: { hy: 'Ռադիատորներ', ru: 'Радиаторы', en: 'Radiators' },
        order: 1,
    },
    {
        slug: 'boilers',
        parentSlug: 'heating',
        name: { hy: 'Կաթսաներ', ru: 'Котлы', en: 'Boilers' },
        order: 2,
    },
    {
        slug: 'ventilation',
        parentSlug: 'heating',
        name: { hy: 'Օդափոխություն', ru: 'Вентиляция', en: 'Ventilation' },
        order: 3,
    },
    {
        slug: 'air-conditioning',
        parentSlug: 'heating',
        name: { hy: 'Օդորակիչներ', ru: 'Кондиционеры', en: 'Air conditioning' },
        order: 4,
    },

    // Garden & exterior
    {
        slug: 'paving',
        parentSlug: 'garden',
        name: { hy: 'Սալահատակ', ru: 'Тротуарная плитка', en: 'Paving' },
        order: 1,
    },
    {
        slug: 'fencing',
        parentSlug: 'garden',
        name: { hy: 'Ցանկապատ', ru: 'Заборы и ограждения', en: 'Fencing' },
        order: 2,
    },
    {
        slug: 'garden-tools',
        parentSlug: 'garden',
        name: { hy: 'Այգու գործիքներ', ru: 'Садовый инструмент', en: 'Garden tools' },
        order: 3,
    },

    // Fasteners & hardware
    {
        slug: 'screws',
        parentSlug: 'fasteners',
        name: { hy: 'Պտուտակներ և մեխեր', ru: 'Саморезы и гвозди', en: 'Screws & nails' },
        order: 1,
    },
    {
        slug: 'anchors',
        parentSlug: 'fasteners',
        name: { hy: 'Անկյունակ և դյուբել', ru: 'Анкеры и дюбели', en: 'Anchors & dowels' },
        order: 2,
    },
    {
        slug: 'sealants',
        parentSlug: 'fasteners',
        name: { hy: 'Սոսինձ և հերմետիկ', ru: 'Клеи и герметики', en: 'Adhesives & sealants' },
        order: 3,
    },
];

const CATEGORIES: CategorySeed[] = [...ROOTS, ...LEAVES];

/** Все slug категорий — для перекрёстных ссылок в товарах. */
export const CATEGORY_SLUGS: string[] = CATEGORIES.map((c) => c.slug);

/** Листовые категории (без детей) — к ним привязываем товары. */
export const LEAF_CATEGORY_SLUGS: string[] = LEAVES.map((c) => c.slug);

/** Имена листовых категорий (slug → трёхъязычное имя) — основа для названий товаров. */
export const LEAF_NAMES: Record<string, LocalizedText> = Object.fromEntries(
    LEAVES.map((c) => [c.slug, c.name]),
);

export function buildCategories(): SeedRecord[] {
    return CATEGORIES.map((c) => {
        const doc: Record<string, unknown> = {
            _id: categoryId(c.slug),
            slug: c.slug,
            name: c.name,
            icon: c.icon,
            order: c.order,
        };
        if (c.parentSlug !== undefined) {
            doc['parentId'] = categoryId(c.parentSlug);
        }
        return { collection: COLLECTIONS.categories, key: { slug: c.slug }, doc };
    });
}
