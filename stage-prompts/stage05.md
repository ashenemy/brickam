# ▶ STAGE 5 — Корзина, заказ, платёж с разбивкой, комиссия
Выполни ТОЛЬКО Stage 5. Foundations §11 (бизнес-правила!), §15.

**Цель:** оформление и ОДИН платёж, разбитый по вендорам; комиссия с продавца после скидки в AMD. Эскроу НЕТ.

**Сделай:** `feature/orders` + `feature/payments`.
- `carts` (группировка позиций по вендору). Оформление: адрес, хук под скидку лояльности (применится в Stage 12).
- При оформлении строй `order` + по одному `vendor_order` на вендора. Расчёт (целые AMD):
  - `vendorSubtotalAfterDiscount` = сумма позиций вендора после товарных скидок;
  - `commissionAmount = round(vendorSubtotalAfterDiscount * commissionPercent/100)` (процент из конфига);
  - `payoutAmount = vendorSubtotalAfterDiscount − commissionAmount`.
- Один `payment` (заглушка провайдера) на сумму заказа; `payment.splits[]` = по вендорам `{amount, commissionAmount, payoutAmount}`.
- Статусы заказа (created→paid→processing→completed→cancelled) и доставки в `vendor_orders.deliveryStatus` + `deliveryEvents[]`. Номера заказов.
- Списание `stock`; проверка наличия.

**Тесты:** юнит расчёта (subtotal→комиссия после скидки→payout→splits, округление AMD), мультивендорный кейс; e2e оформление→оплата(заглушка)→`vendor_orders`+`splits`; негативы (пустая корзина, нет остатка).

**✓ Чек-лист:**
- [ ] один платёж корректно разбивается по вендорам
- [ ] комиссия = на сумму после скидки, целые AMD; payout верный
- [ ] статусы заказа/доставки меняются; stock списывается
- [ ] эскроу отсутствует
- [ ] тесты/покрытие ок

