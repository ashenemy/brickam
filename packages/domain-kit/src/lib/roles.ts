/** Роли пользователей (Foundations §14). */
export enum Role {
    Buyer = 'buyer',
    VendorOwner = 'vendor_owner',
    VendorMember = 'vendor_member',
    Admin = 'admin',
}

/** Тип аккаунта покупателя. */
export enum AccountType {
    Individual = 'individual',
    Company = 'company',
}

/** Права (Foundations §14; без tenders.respond — тендеры убраны). */
export enum Permission {
    OrdersView = 'orders.view',
    ProductsManage = 'products.manage',
    AnalyticsView = 'analytics.view',
    ChatHandle = 'chat.handle',
    InvoicesCreate = 'invoices.create',
}

export enum UserStatus {
    Active = 'active',
    Blocked = 'blocked',
}

export enum VendorStatus {
    Pending = 'pending',
    Approved = 'approved',
    Blocked = 'blocked',
}

const ALL_PERMISSIONS: Permission[] = [
    Permission.OrdersView,
    Permission.ProductsManage,
    Permission.AnalyticsView,
    Permission.ChatHandle,
    Permission.InvoicesCreate,
];

/**
 * Права по умолчанию для роли. У vendor_member фактический набор берётся из
 * vendor_members.permissions[] (заполняется при членстве); тут — пустой дефолт.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    [Role.Admin]: [...ALL_PERMISSIONS],
    [Role.VendorOwner]: [...ALL_PERMISSIONS],
    [Role.VendorMember]: [],
    [Role.Buyer]: [],
};
