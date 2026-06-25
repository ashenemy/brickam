import type { BulkUpdate, ProductBulkView } from '../@types';

/**
 * Контракт массовых операций над товарами (Foundations §14). Реализует
 * `catalog` (владелец товаров); `vendor-bulk` зависит только от контракта.
 * Все операции SCOPED по вендору — нельзя трогать чужие товары.
 */
export abstract class CatalogBulkContract {
    /** Проекции товаров вендора по id (чужие/несуществующие отбрасываются). */
    abstract listForBulk(vendorId: string, productIds: string[]): Promise<ProductBulkView[]>;
    /** Применяет точечные обновления (только товары этого вендора). */
    abstract applyBulk(vendorId: string, updates: BulkUpdate[]): Promise<{ modified: number }>;
}
