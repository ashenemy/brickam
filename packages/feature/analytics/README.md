# @brickam/analytics

Аналитика вендора Brickam (Stage 15, Foundations §14). Дашборд SCOPED по
вендору, право `analytics.view`. Собирает сводку (GMV/заказы/средний чек),
дневной временной ряд выручки, воронку статусов доставки и топ-10 товаров из
`OrdersAnalyticsContract` (владелец данных — `orders`). Дашборд кешируется
in-memory по `vendorId+from+to` на TTL. Экспорт в CSV и XLSX (exceljs).
