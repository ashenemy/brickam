import type { AccountType, Permission, Role, UserStatus } from '../lib/roles';

/**
 * Контракт пользователя — POJO, которым обмениваются фичи (без Mongoose-документа).
 * passwordHash нужен auth для проверки пароля; наружу не отдаётся (@Exclude в схеме/DTO).
 */
export type UserContract = {
    id: string;
    role: Role;
    accountType?: AccountType;
    name: string;
    phone: string;
    phoneVerified: boolean;
    passwordHash: string;
    lang: string;
    status: UserStatus;
    vendorId?: string;
    permissions?: Permission[];
};

/** Данные создания пользователя (пароль уже захеширован вызывающим auth). */
export type CreateUserContract = {
    role: Role;
    accountType?: AccountType;
    name: string;
    phone: string;
    passwordHash: string;
    lang?: string;
};

/** Полезная нагрузка JWT (access). */
export type JwtPayload = {
    sub: string;
    role: Role;
    permissions: Permission[];
    vendorId?: string;
};

/** Пара токенов. */
export type AuthTokens = {
    accessToken: string;
    refreshToken: string;
};

/** Мультиязычный текст (hy — дефолт). */
export type LocalizedText = {
    hy: string;
    ru: string;
    en: string;
};

/** Тип шаблона/канала. */
export type TemplateType = 'email' | 'sms';

/** Переменные для подстановки в шаблон (белый список — в самом шаблоне). */
export type TemplateVars = Record<string, string | number | boolean>;

/** Результат рендера шаблона. */
export type RenderedTemplate = {
    subject?: string;
    body: string;
};

// ───────────────────── Заказы / платежи (Foundations §11, §15) ─────────────────────

/** Скидка на товар. */
export type DiscountInput = {
    type: 'percent' | 'amount';
    value: number;
    activeFrom?: string | Date | null;
    activeTo?: string | Date | null;
};

/** Снимок товара для оформления заказа (отдаёт catalog). */
export type ProductSnapshot = {
    id: string;
    vendorId: string;
    title: LocalizedText;
    unit: string;
    price: number;
    discount?: DiscountInput;
    stock: number;
};

/** Позиция корзины/заказа на входе расчёта. */
export type OrderLineInput = {
    productId: string;
    vendorId: string;
    qty: number;
    price: number;
    discount?: DiscountInput;
    titleSnapshot?: LocalizedText;
    unit?: string;
};

/** Позиция саб-заказа вендора (после расчёта). */
export type VendorOrderItem = {
    productId: string;
    titleSnapshot?: LocalizedText;
    qty: number;
    unitPrice: number;
    discountApplied: number;
    lineTotal: number;
};

/** Разбивка по вендору. */
export type VendorBreakdown = {
    vendorId: string;
    items: VendorOrderItem[];
    subtotal: number;
    commissionPercent: number;
    commissionAmount: number;
    payoutAmount: number;
};

/** Сплит платежа по вендору. */
export type VendorSplit = {
    vendorId: string;
    amount: number;
    commissionAmount: number;
    payoutAmount: number;
};

/** Результат расчёта заказа (целые AMD). */
export type OrderCalcResult = {
    subtotal: number;
    productDiscountTotal: number;
    loyaltyDiscount: number;
    total: number;
    vendors: VendorBreakdown[];
    splits: VendorSplit[];
};

/** Вход создания платежа. */
export type CreatePaymentInput = {
    orderId: string;
    buyerId: string;
    amount: number;
    splits: VendorSplit[];
};

/** Основа расчёта уровня лояльности (Foundations §11/§15). */
export type LoyaltyBasis = 'total_spend' | 'order_count';

/** Сводка-метрика лояльности покупателя (хранится в users.loyalty). */
export type LoyaltyMetric = {
    totalSpend: number;
    totalOrders: number;
    currentTierId?: string;
};

/** Патч метрики лояльности при завершении заказа. */
export type LoyaltyUpdate = {
    totalSpend: number;
    totalOrders: number;
    currentTierId?: string;
};

/** Предпросмотр скидки лояльности на оформлении (несёт платформа). */
export type LoyaltyDiscountPreview = {
    loyaltyDiscount: number;
    tierId?: string;
};

/** Проекция товара для массовых операций (vendor-bulk, Foundations §14). */
export type ProductBulkView = {
    id: string;
    price: number;
    discount?: DiscountInput;
    stock: number;
    status: string;
    categoryId: string;
    title: LocalizedText;
};

/** Массовая операция над товарами вендора. */
export type BulkOp =
    | { kind: 'price'; mode: 'percent' | 'amount' | 'set'; value: number }
    | { kind: 'discountSet'; discount: DiscountInput }
    | { kind: 'discountRemove' }
    | { kind: 'stock'; mode: 'set' | 'inc'; value: number }
    | { kind: 'status'; status: 'active' | 'hidden' }
    | { kind: 'category'; categoryId: string };

/** Изменяемые поля товара при массовой операции. */
export type BulkProductFields = {
    price?: number;
    discount?: DiscountInput | null;
    stock?: number;
    status?: string;
    categoryId?: string;
};

/** Точечное обновление товара (результат расчёта bulk). */
export type BulkUpdate = {
    productId: string;
    fields: BulkProductFields;
};

/** Элемент превью массовой операции (до/после). */
export type BulkPreviewItem = {
    productId: string;
    title: LocalizedText;
    before: BulkProductFields;
    after: BulkProductFields;
};

/** Сводка аналитики вендора. */
export type AnalyticsSummary = {
    gmv: number;
    orders: number;
    avgCheck: number;
};

/** Точка временного ряда выручки. */
export type AnalyticsBucket = {
    date: string;
    gmv: number;
    orders: number;
};

/** Воронка статусов саб-заказов. */
export type StatusFunnelItem = {
    status: string;
    count: number;
};

/** Топ-товар по продажам. */
export type TopProductItem = {
    productId: string;
    qty: number;
    revenue: number;
};

/** Назначение прав суб-аккаунту вендора (permissions/role — строковые коды). */
export type MemberAccess = {
    vendorId: string;
    permissions: string[];
    role: string;
};

/** Запись аудита ключевого действия (audit_logs, §15). */
export type AuditEntry = {
    actorId: string;
    action: string;
    targetType?: string;
    targetId?: string;
    meta?: Record<string, unknown>;
};

/** Платформенная сводка для админ-аналитики (§14). */
export type PlatformAnalyticsSummary = {
    gmv: number;
    platformRevenue: number;
    orders: number;
};

/** Базовые промпт-шаблоны платформы (platform_settings.aiPrompts, §13). */
export type AiPrompts = {
    description: string;
    image: string;
    video: string;
};

/** Тип AI-задачи ассистента продавца. */
export type AiJobType = 'description' | 'image' | 'video';

/** Статус AI-задачи (ai_jobs). */
export type AiJobStatus = 'queued' | 'processing' | 'done' | 'failed';

/** Медиа-дескриптор (обложка/галерея) для прикрепления к товару. */
export type MediaInput = {
    mediaType: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
};

/** Контекст товара для сборки промпта (title/description/категория). */
export type ProductAiContext = {
    title: LocalizedText;
    description: LocalizedText;
    categoryId: string;
    gallery: string[];
};

/** Тема из строгого JSON-ответа LLM (Foundations §13). */
export type AiThemeSpec = {
    name: string;
    materialCategories: string[];
    keywords: string[];
};

/** Строгая JSON-схема ответа LLM на описание проекта. */
export type AiQuerySpec = {
    projectType: string;
    themes: AiThemeSpec[];
};

/** Товар-результат гибридного подбора (вектор+ключевые слова). */
export type ProductSearchHit = {
    id: string;
    slug: string;
    title: LocalizedText;
    finalPrice: number;
    unit: string;
    vendorId: string;
    categoryId: string;
    cover?: string;
};

/** Тема результата AI-поиска с пояснением и подобранными товарами. */
export type AiSearchThemeResult = {
    name: string;
    explanation: string;
    materialCategories: string[];
    keywords: string[];
    products: ProductSearchHit[];
};

/** Результат AI-поиска, сгруппированный по темам. */
export type AiSearchResult = {
    projectType: string;
    themes: AiSearchThemeResult[];
};

/** Позиция инвойса. */
export type InvoiceLineItem = {
    title: string;
    qty: number;
    price: number;
};

/** Адрес доставки (снимок). */
export type AddressInput = {
    label: string;
    region: string;
    city: string;
    line1: string;
    line2?: string;
    phone: string;
};

/** Вход создания заказа из оплаченного инвойса (Stage 9 → §11). */
export type InvoiceOrderInput = {
    invoiceId: string;
    buyerId: string;
    vendorId: string;
    lineItems: InvoiceLineItem[];
    discount?: DiscountInput;
    currency: string;
    deliveryAddress?: AddressInput;
};

/** Результат создания заказа из инвойса. */
export type InvoiceOrderResult = {
    orderId: string;
    orderNumber: string;
    paymentId: string;
    total: number;
};

/** Саб-заказ вендора в форме, нужной для проверки права на отзыв (Stage 7). */
export type VendorOrderForReview = {
    id: string;
    orderId: string;
    vendorId: string;
    buyerId: string;
    orderStatus: string;
    productIds: string[];
};
