/**
 * Контракт вендоров для кросс-фичевых операций (Foundations §14/§15).
 * Реализует feature `vendors`; `auth` (онбординг) и `reviews` (денормализация
 * рейтинга) зависят только от контракта. Инжектится опционально (@Optional):
 * без него потребители работают в прежнем режиме.
 */
export abstract class VendorsServiceContract {
    /** Создаёт вендора в статусе `pending` для владельца, возвращает vendorId. */
    abstract createForOwner(ownerUserId: string): Promise<{ vendorId: string }>;
    /** Денормализует агрегат рейтинга вендора (вызывает reviews после пересчёта). */
    abstract setRating(vendorId: string, ratingAvg: number, ratingCount: number): Promise<void>;
}
