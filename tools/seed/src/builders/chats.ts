import { COLLECTIONS, type SeedRecord } from '../types';
import { productId } from './products';
import { BUYERS, buyerUserId } from './users';
import { vendorId, vendorOwnerUserId } from './vendors';

/** Время для сидируемых чатов/инвойсов передаётся явно (детерминированность). */
export type ChatSeedClock = {
    /** Базовый момент создания диалога. */
    createdAt: Date;
    /** Срок действия инвойса. */
    validUntil: Date;
};

type ChatSeed = {
    n: number;
    buyerIndex: number;
    vendorSlug: string;
    /** Позиции инвойса: товар + кол-во. */
    lineItems: { productSlug: string; title: string; qty: number; price: number }[];
    invoiceStatus: 'sent' | 'paid';
};

const CHATS: ChatSeed[] = [
    {
        n: 1,
        buyerIndex: 0,
        vendorSlug: 'shin-market',
        lineItems: [
            {
                productSlug: 'cement-m500-standard',
                title: 'Цемент М500 «Standard»',
                qty: 20,
                price: 4200,
            },
            {
                productSlug: 'putty-finish-standard',
                title: 'Шпаклёвка финишная «Standard»',
                qty: 10,
                price: 5600,
            },
        ],
        invoiceStatus: 'sent',
    },
    {
        n: 2,
        buyerIndex: 1,
        vendorSlug: 'ararat-shinanyut',
        lineItems: [
            {
                productSlug: 'ceramic-tile-standard',
                title: 'Плитка керамическая «Standard»',
                qty: 35,
                price: 7800,
            },
        ],
        invoiceStatus: 'paid',
    },
];

const sum = (items: ChatSeed['lineItems']): number =>
    items.reduce((acc, i) => acc + i.qty * i.price, 0);

/**
 * Строит согласованные чаты + инвойсы + сообщения. Все ссылки валидны:
 * chat.buyerId∈buyers, chat.vendorId∈vendors, invoice.chatId∈chats,
 * message(type='invoice').invoiceId∈invoices.
 */
export function buildChats(clock: ChatSeedClock): SeedRecord[] {
    const records: SeedRecord[] = [];

    for (const c of CHATS) {
        const buyer = BUYERS[c.buyerIndex] as { phone: string };
        const buyerId = buyerUserId(buyer.phone);
        const vId = vendorId(c.vendorSlug);
        const ownerId = vendorOwnerUserId(c.vendorSlug);
        const chatId = `chat_seed_${c.n}`;
        const invoiceId = `invoice_seed_${c.n}`;
        const invoiceNumber = `INV-SEED-${String(c.n).padStart(4, '0')}`;

        const subtotal = sum(c.lineItems);
        const discountValue = 5;
        const total = Math.round(subtotal * (1 - discountValue / 100));

        // Чат
        records.push({
            collection: COLLECTIONS.chats,
            key: { _id: chatId },
            doc: {
                _id: chatId,
                buyerId,
                vendorId: vId,
                participants: [
                    { userId: buyerId, role: 'buyer' },
                    { userId: ownerId, role: 'vendor' },
                ],
                lastMessageAt: clock.createdAt,
                unread: { buyer: 0, vendor: 0 },
            },
        });

        // Текстовое сообщение покупателя
        records.push({
            collection: COLLECTIONS.messages,
            key: { _id: `msg_${c.n}_1` },
            doc: {
                _id: `msg_${c.n}_1`,
                chatId,
                senderId: buyerId,
                type: 'text',
                text: 'Здравствуйте! Хочу заказать материалы, можете выставить счёт?',
                readBy: [buyerId, ownerId],
            },
        });

        // Инвойс
        records.push({
            collection: COLLECTIONS.invoices,
            key: { invoiceNumber },
            doc: {
                _id: invoiceId,
                invoiceNumber,
                chatId,
                vendorId: vId,
                buyerId,
                lineItems: c.lineItems.map((i) => ({
                    title: i.title,
                    qty: i.qty,
                    price: i.price,
                })),
                discount: { type: 'percent', value: discountValue },
                subtotal,
                total,
                currency: 'AMD',
                validUntil: clock.validUntil,
                status: c.invoiceStatus,
                pdfUrl: `https://cdn.buildhub.am/invoices/${invoiceNumber}.pdf`,
            },
        });

        // Сообщение типа invoice
        records.push({
            collection: COLLECTIONS.messages,
            key: { _id: `msg_${c.n}_2` },
            doc: {
                _id: `msg_${c.n}_2`,
                chatId,
                senderId: ownerId,
                type: 'invoice',
                invoiceId,
                text: `Счёт №${invoiceNumber} на сумму ${total} AMD.`,
                readBy: [ownerId],
            },
        });

        // Ссылка на товар из позиций (для целостности product ∈ products)
        for (const i of c.lineItems) {
            // продукт уже существует через products-билдер; здесь только проверка id
            void productId(i.productSlug);
        }
    }

    return records;
}

/** Метаданные для теста целостности. */
export const CHAT_BUYER_INDEXES = CHATS.map((c) => c.buyerIndex);
export const CHAT_VENDOR_SLUGS = CHATS.map((c) => c.vendorSlug);
export const CHAT_LINE_ITEM_PRODUCT_SLUGS = CHATS.flatMap((c) =>
    c.lineItems.map((i) => i.productSlug),
);
