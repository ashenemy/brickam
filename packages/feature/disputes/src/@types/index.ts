/** Статус спора по заказу. */
export type DisputeStatus = 'open' | 'reviewing' | 'resolved';

/** Спор (публичный API-контракт, без Mongoose-документа). */
export type DisputeContract = {
    id: string;
    orderId: string;
    vendorOrderId?: string;
    openedByUserId: string;
    vendorId: string;
    reason: string;
    status: DisputeStatus;
    resolution?: string;
    at: Date;
    createdAt: Date;
    updatedAt: Date;
};
