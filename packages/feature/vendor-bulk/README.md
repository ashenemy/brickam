# @brickam/vendor-bulk

Массовые операции над товарами вендора Brickam (Stage 15, Foundations §14).
Предпросмотр (до/после) и применение операций над выборкой товаров: цена
(percent/amount/set), скидка (set/remove), остаток (set/inc), статус, категория.

- `computeBulk` — чистый расчёт `previews`/`updates` (только изменённые поля,
  неотрицательность цены/остатка) из проекций товаров.
- `BulkService` — малые наборы (`<= SYNC_THRESHOLD`, 50) применяются синхронно,
  большие уходят в BullMQ-очередь `vendor-bulk` (обрабатывает `BulkProcessor`).
- Границы feature: товары приходят/обновляются только через `CatalogBulkContract`
  (catalog — владелец товаров); SCOPED по вендору.
