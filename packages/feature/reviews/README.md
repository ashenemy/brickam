# @brickam/reviews

Отзывы и рейтинги BuildHub (Stage 7, Foundations §15). Отзыв (rating 1–5 + text)
можно оставить только по завершённому (`completed`) и своему саб-заказу вендора,
ровно один на vendor_order. Пересчёт агрегатов товара (через CatalogServiceContract)
и вендора; модерация через статус `published`/`hidden`.
