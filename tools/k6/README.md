# k6 — нагрузочные скрипты Brickam

Сценарии для проверки производительности API под нагрузкой.

| Скрипт | Что делает | Профиль |
|--------|-----------|---------|
| `smoke.js` | Быстрый прогон ключевых публичных GET (health, catalog) | 1 VU, 1 итерация |
| `catalog.js` | Нагрузка на листинг товаров `GET /api/v1/catalog/products` | ramp до 100 VU |
| `checkout.js` | Полный путь покупателя: login → каталог → корзина → checkout | ramp до 25 VU |

## Установка k6

- **Бинарь**: https://grafana.com/docs/k6/latest/set-up/install-k6/
  (Windows: `winget install k6` или `choco install k6`; macOS: `brew install k6`).
- **Docker**: `docker run --rm -i grafana/k6 run - <tools/k6/smoke.js`
  (или смонтируйте папку: `-v "$PWD/tools/k6:/scripts" grafana/k6 run /scripts/smoke.js`).

## Запуск

Базовый URL задаётся через `-e BASE_URL=...` (по умолчанию `http://localhost:3000`).
Указывайте URL edge-домена (через reverse-proxy), чтобы тестировать реальный путь.

```bash
# Smoke (CI-friendly, быстро)
k6 run -e BASE_URL=https://example.com tools/k6/smoke.js

# Каталог под нагрузкой
k6 run -e BASE_URL=https://example.com tools/k6/catalog.js

# Полный checkout (нужны реальные учётка и товар!)
k6 run -e BASE_URL=https://example.com \
       -e USER_PHONE=+37400000000 \
       -e USER_PASSWORD='секрет' \
       -e PRODUCT_ID=<id существующего товара> \
       tools/k6/checkout.js
```

### Переменные окружения (`-e KEY=VALUE`)

| Переменная | Скрипт | По умолчанию | Назначение |
|------------|--------|--------------|------------|
| `BASE_URL` | все | `http://localhost:3000` | Корень API (без `/api`) |
| `USER_PHONE` | checkout | `+37400000000` | Телефон тестовой учётки |
| `USER_PASSWORD` | checkout | `Password123!` | Пароль тестовой учётки |
| `PRODUCT_ID` | checkout | — (берётся первый из каталога) | ID товара для корзины |

## Пороги (thresholds)

В каждом скрипте заданы пороги (`http_req_failed`, `http_req_duration` p95/p99 и
кастомные счётчики). Если порог нарушен — k6 завершается с ненулевым кодом, что
удобно для встраивания в пайплайн (например, отдельный manual job).

## Замечания

- `checkout.js` создаёт **реальные заказы** — гоняйте только против
  стейджинга/нагрузочного стенда с тестовыми данными, не против боевого прода.
- API в dual-mode (cookie/Bearer): k6 хранит cookie на VU автоматически, а
  скрипт дополнительно шлёт `Bearer` из тела login — устойчиво к Secure-cookie
  за TLS-прокси.
- Эти файлы — обычный JS под рантайм k6 (не Node). Импорты `k6/http` и т.п. и
  глобалы `__ENV/__VU/__ITER` существуют только в k6 (резолвятся бинарём k6,
  а не Node). Скрипты проходят `biome check tools/k6` без ошибок.
