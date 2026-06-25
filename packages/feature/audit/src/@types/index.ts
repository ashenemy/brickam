/** Запись аудит-лога (публичный контракт, без Mongoose-документа). */
export type AuditLogView = {
    id: string;
    actorId: string;
    action: string;
    targetType?: string;
    targetId?: string;
    meta?: Record<string, unknown>;
    at: Date;
    createdAt: Date;
    updatedAt: Date;
};
