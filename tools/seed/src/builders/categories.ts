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
 * Дерево строительных категорий (2 уровня). Корни без parent, подкатегории
 * ссылаются на корень через parentSlug → categoryId(parentSlug).
 */
const CATEGORIES: CategorySeed[] = [
    // Корни
    {
        slug: 'finishing',
        name: { hy: 'Հարդարում', ru: 'Отделка', en: 'Finishing' },
        icon: 'brush',
        order: 1,
    },
    {
        slug: 'plumbing',
        name: { hy: 'Սանտեխնիկա', ru: 'Сантехника', en: 'Plumbing' },
        icon: 'faucet',
        order: 2,
    },
    {
        slug: 'electrics',
        name: { hy: 'Էլեկտրականություն', ru: 'Электрика', en: 'Electrics' },
        icon: 'bolt',
        order: 3,
    },
    {
        slug: 'flooring',
        name: { hy: 'Հատակի ծածկույթ', ru: 'Напольные покрытия', en: 'Flooring' },
        icon: 'floor',
        order: 4,
    },
    {
        slug: 'paints',
        name: { hy: 'Ներկեր և լաքեր', ru: 'Краски и лаки', en: 'Paints & varnishes' },
        icon: 'palette',
        order: 5,
    },
    {
        slug: 'dry-mixes',
        name: { hy: 'Չոր խառնուրդներ', ru: 'Сухие смеси', en: 'Dry mixes' },
        icon: 'bag',
        order: 6,
    },
    {
        slug: 'drywall',
        name: {
            hy: 'Գիպսաստվարաթուղթ և պրոֆիլներ',
            ru: 'Гипсокартон и профили',
            en: 'Drywall & profiles',
        },
        icon: 'panel',
        order: 7,
    },
    {
        slug: 'tools',
        name: { hy: 'Գործիքներ', ru: 'Инструменты', en: 'Tools' },
        icon: 'wrench',
        order: 8,
    },

    // Подкатегории — Отделка
    {
        slug: 'tiles',
        parentSlug: 'finishing',
        name: { hy: 'Սալիկ', ru: 'Плитка', en: 'Tiles' },
        order: 1,
    },
    {
        slug: 'wallpaper',
        parentSlug: 'finishing',
        name: { hy: 'Պաստառ', ru: 'Обои', en: 'Wallpaper' },
        order: 2,
    },

    // Подкатегории — Сантехника
    {
        slug: 'faucets',
        parentSlug: 'plumbing',
        name: { hy: 'Ծորակներ', ru: 'Смесители', en: 'Faucets' },
        order: 1,
    },
    {
        slug: 'pipes',
        parentSlug: 'plumbing',
        name: { hy: 'Խողովակներ', ru: 'Трубы', en: 'Pipes' },
        order: 2,
    },

    // Подкатегории — Электрика
    {
        slug: 'cables',
        parentSlug: 'electrics',
        name: { hy: 'Մալուխներ', ru: 'Кабели', en: 'Cables' },
        order: 1,
    },
    {
        slug: 'sockets',
        parentSlug: 'electrics',
        name: { hy: 'Վարդակներ', ru: 'Розетки и выключатели', en: 'Sockets & switches' },
        order: 2,
    },

    // Подкатегории — Напольные покрытия
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

    // Подкатегории — Сухие смеси
    {
        slug: 'cement',
        parentSlug: 'dry-mixes',
        name: { hy: 'Ցեմենտ', ru: 'Цемент', en: 'Cement' },
        order: 1,
    },
    {
        slug: 'putty',
        parentSlug: 'dry-mixes',
        name: { hy: 'Մածիկ', ru: 'Шпаклёвка', en: 'Putty' },
        order: 2,
    },
    {
        slug: 'plaster',
        parentSlug: 'dry-mixes',
        name: { hy: 'Գիպս', ru: 'Штукатурка', en: 'Plaster' },
        order: 3,
    },
];

/** Все slug категорий — для перекрёстных ссылок в товарах. */
export const CATEGORY_SLUGS: string[] = CATEGORIES.map((c) => c.slug);

/** Листовые категории (без детей) — к ним привязываем товары. */
export const LEAF_CATEGORY_SLUGS: string[] = CATEGORIES.filter(
    (c) => c.parentSlug !== undefined,
).map((c) => c.slug);

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
