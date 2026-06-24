/** Сторона участника чата. */
export type ChatSide = 'buyer' | 'vendor';

/** Тип сообщения чата. */
export type MessageType = 'text' | 'invoice' | 'file' | 'system';

/** Участник чата (под-документ Chat). */
export type ChatParticipant = {
    userId: string;
    role: ChatSide;
};

/** Счётчики непрочитанных по сторонам (под-документ Chat). */
export type ChatUnread = {
    buyer: number;
    vendor: number;
};

/** Плоский контракт чата (без Mongoose-документа). */
export type ChatView = {
    id: string;
    buyerId: string;
    vendorId: string;
    participants: ChatParticipant[];
    lastMessageAt?: Date;
    /** Непрочитанные для стороны текущего пользователя. */
    unread: number;
    createdAt: Date;
    updatedAt: Date;
};

/** Плоский контракт сообщения (без Mongoose-документа). */
export type MessageView = {
    id: string;
    chatId: string;
    senderId: string;
    type: MessageType;
    text?: string;
    attachmentUrl?: string;
    invoiceId?: string;
    readBy: string[];
    createdAt: Date;
    updatedAt: Date;
};

/**
 * Минимальная форма участника для методов сервиса. Аналог JwtPayload в части,
 * нужной для проверки доступа: `userId` (sub) и опциональный `vendorId`.
 */
export type ChatPrincipal = {
    userId: string;
    vendorId?: string;
};

/** Данные отправки сообщения (вход sendMessage). */
export type SendMessagePayload = {
    type?: MessageType;
    text?: string;
    attachmentUrl?: string;
};
