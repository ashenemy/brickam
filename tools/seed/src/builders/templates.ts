import { COLLECTIONS, type LocalizedText, type SeedRecord } from '../types';

type TemplateSeed = {
    key: string;
    type: 'email' | 'sms';
    name: string;
    subject?: LocalizedText;
    content: LocalizedText;
    variables: string[];
};

/**
 * Дефолтные шаблоны (Foundations §10/§15). Тип ограничен схемой ('email'|'sms').
 * Страницы about/privacy выражены как email-шаблоны-заглушки (отдельной
 * page-схемы в репо нет), ключ с префиксом `page.`.
 */
const TEMPLATES: TemplateSeed[] = [
    {
        key: 'otp.sms',
        type: 'sms',
        name: 'OTP код подтверждения (SMS)',
        content: {
            hy: 'Brickam. Ձեր հաստատման կոդը՝ {{code}}: Մի՛ կիսվեք այն ոչ ոքի հետ:',
            ru: 'Brickam. Ваш код подтверждения: {{code}}. Никому его не сообщайте.',
            en: 'Brickam. Your verification code: {{code}}. Do not share it.',
        },
        variables: ['code'],
    },
    {
        key: 'welcome.sms',
        type: 'sms',
        name: 'Приветствие (SMS)',
        content: {
            hy: 'Բարի գալուստ Brickam, {{name}}: Շնորհակալություն գրանցման համար:',
            ru: 'Добро пожаловать в Brickam, {{name}}! Спасибо за регистрацию.',
            en: 'Welcome to Brickam, {{name}}! Thanks for signing up.',
        },
        variables: ['name'],
    },
    {
        key: 'welcome.email',
        type: 'email',
        name: 'Приветственное письмо',
        subject: {
            hy: 'Բարի գալուստ Brickam',
            ru: 'Добро пожаловать в Brickam',
            en: 'Welcome to Brickam',
        },
        content: {
            hy: 'Ողջույն, {{name}}: Շնորհակալ ենք Brickam-ին միանալու համար:',
            ru: 'Здравствуйте, {{name}}! Спасибо, что присоединились к Brickam.',
            en: 'Hello, {{name}}! Thank you for joining Brickam.',
        },
        variables: ['name'],
    },
    {
        key: 'order.notification.email',
        type: 'email',
        name: 'Уведомление о заказе',
        subject: {
            hy: 'Ձեր պատվերը №{{orderNumber}}',
            ru: 'Ваш заказ №{{orderNumber}}',
            en: 'Your order #{{orderNumber}}',
        },
        content: {
            hy: 'Ձեր պատվերը №{{orderNumber}} ընդունված է: Գումար՝ {{total}} AMD:',
            ru: 'Ваш заказ №{{orderNumber}} принят. Сумма: {{total}} AMD.',
            en: 'Your order #{{orderNumber}} is accepted. Total: {{total}} AMD.',
        },
        variables: ['orderNumber', 'total'],
    },
    {
        key: 'order.notification.sms',
        type: 'sms',
        name: 'Уведомление о заказе (SMS)',
        content: {
            hy: 'Brickam: պատվեր №{{orderNumber}} ընդունված է, {{total}} AMD:',
            ru: 'Brickam: заказ №{{orderNumber}} принят, {{total}} AMD.',
            en: 'Brickam: order #{{orderNumber}} accepted, {{total}} AMD.',
        },
        variables: ['orderNumber', 'total'],
    },
    {
        key: 'page.about',
        type: 'email',
        name: 'Страница «О платформе» (заглушка)',
        subject: { hy: 'Մեր մասին', ru: 'О нас', en: 'About us' },
        content: {
            hy: 'Brickam — շինանյութերի մարկետփլեյս Հայաստանում:',
            ru: 'Brickam — маркетплейс строительных материалов в Армении.',
            en: 'Brickam is a construction materials marketplace in Armenia.',
        },
        variables: [],
    },
    {
        key: 'page.privacy',
        type: 'email',
        name: 'Политика конфиденциальности (заглушка)',
        subject: {
            hy: 'Գաղտնիության քաղաքականություն',
            ru: 'Политика конфиденциальности',
            en: 'Privacy policy',
        },
        content: {
            hy: 'Մենք հարգում ենք ձեր տվյալների գաղտնիությունը: (Հապավում)',
            ru: 'Мы уважаем конфиденциальность ваших данных. (Заглушка)',
            en: 'We respect the privacy of your data. (Stub)',
        },
        variables: [],
    },
];

export function buildTemplates(): SeedRecord[] {
    return TEMPLATES.map((t) => {
        const doc: Record<string, unknown> = {
            _id: `template_${t.key}`,
            key: t.key,
            type: t.type,
            name: t.name,
            content: t.content,
            variables: t.variables,
            isActive: true,
            version: 1,
        };
        if (t.subject !== undefined) {
            doc['subject'] = t.subject;
        }
        return { collection: COLLECTIONS.templates, key: { key: t.key }, doc };
    });
}
