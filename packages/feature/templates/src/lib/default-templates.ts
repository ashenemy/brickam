import type { CreateTemplateData } from '../@types';

/**
 * Базовые шаблоны уведомлений (Foundations §10). Идемпотентно upsert'ятся при
 * старте модуля, если ключа ещё нет в БД. Тексты — на трёх языках с `{{var}}`.
 */
export const DEFAULT_TEMPLATES: CreateTemplateData[] = [
    {
        key: 'auth.otp',
        type: 'sms',
        name: 'OTP-код подтверждения',
        content: {
            hy: 'BRICK կոդ՝ {{code}}: Վավեր է {{ttlMinutes}} րոպե:',
            ru: 'Код BRICK: {{code}}. Действителен {{ttlMinutes}} мин.',
            en: 'BRICK code: {{code}}. Valid {{ttlMinutes}} min.',
        },
        variables: ['code', 'ttlMinutes'],
    },
    {
        key: 'auth.passwordReset',
        type: 'sms',
        name: 'Сброс пароля',
        content: {
            hy: 'Գաղտնաբառի վերականգնման կոդ՝ {{code}}:',
            ru: 'Код для сброса пароля: {{code}}.',
            en: 'Password reset code: {{code}}.',
        },
        variables: ['code'],
    },
    {
        key: 'order.confirmation',
        type: 'email',
        name: 'Подтверждение заказа',
        subject: {
            hy: 'Պատվեր {{orderNumber}} հաստատված է',
            ru: 'Заказ {{orderNumber}} подтверждён',
            en: 'Order {{orderNumber}} confirmed',
        },
        content: {
            hy: 'Ձեր {{orderNumber}} պատվերը հաստատված է: Ընդհանուր գումար՝ {{total}}:',
            ru: 'Ваш заказ {{orderNumber}} подтверждён. Сумма: {{total}}.',
            en: 'Your order {{orderNumber}} is confirmed. Total: {{total}}.',
        },
        variables: ['orderNumber', 'total'],
    },
    {
        key: 'order.status',
        type: 'sms',
        name: 'Изменение статуса заказа',
        content: {
            hy: 'Պատվեր {{orderNumber}}. Կարգավիճակ՝ {{status}}:',
            ru: 'Заказ {{orderNumber}}. Статус: {{status}}.',
            en: 'Order {{orderNumber}}. Status: {{status}}.',
        },
        variables: ['orderNumber', 'status'],
    },
    {
        key: 'invoice.created',
        type: 'email',
        name: 'Счёт выставлен',
        subject: {
            hy: 'Հաշիվ {{invoiceNumber}}',
            ru: 'Счёт {{invoiceNumber}}',
            en: 'Invoice {{invoiceNumber}}',
        },
        content: {
            hy: '{{invoiceNumber}} հաշիվը պատրաստ է: Գումար՝ {{total}}:',
            ru: 'Счёт {{invoiceNumber}} готов. Сумма: {{total}}.',
            en: 'Invoice {{invoiceNumber}} is ready. Amount: {{total}}.',
        },
        variables: ['invoiceNumber', 'total'],
    },
];
