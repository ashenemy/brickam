/** Член команды вендора (публичный API-контракт). */
export type VendorMemberContract = {
    id: string;
    vendorId: string;
    userId: string;
    role: string;
    permissions: string[];
    createdAt: Date;
    updatedAt: Date;
};
