/** Счётчики непрочитанных по ролям участников чата. */
export type ChatUnread = {
    buyer: number;
    vendor: number;
};

/** Представление чата (диалог покупатель ↔ продавец). */
export type ChatView = {
    id: string;
    buyerId: string;
    vendorId: string;
    participants: string[];
    lastMessageAt?: string;
    unread: ChatUnread;
};

/** Тип сообщения. */
export type MessageType = 'text' | 'attachment' | 'system';

/** Представление сообщения в чате. */
export type MessageView = {
    id: string;
    chatId: string;
    senderId: string;
    type: MessageType;
    text?: string;
    attachmentUrl?: string;
    readBy: string[];
    createdAt: string;
};
