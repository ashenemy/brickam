# Changelog

Все значимые изменения проекта документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/),
проект придерживается [семантического версионирования](https://semver.org/lang/ru/).
Заголовки коммитов — Conventional Commits (`type(scope): ...`), что позволяет в
дальнейшем автоматизировать выпуск (semantic-release) и генерацию этого файла.

## [Unreleased]

### Added
- Идемпотентность мутаций: заголовок `Idempotency-Key`, коллекция `idempotency_keys`
  (TTL 24ч), глобальный интерсептор (replay сохранённого ответа, 409 при конфликте).
  Включена на `POST /orders/checkout`, `/orders/:id/pay`, `/invoices/:id/pay`.
- Версионированные миграции БД (`npm run migrate`) + явные индексы (24 коллекции).
- Безопасность: глобальный rate-limiting (throttler), `helmet`, httpOnly-cookie для
  токенов (dual-mode cookie/Bearer), Redis для OTP/refresh-сторов.
- Наблюдаемость: Sentry (5xx), readiness/liveness-пробы (`/health/live`, `/health/ready`),
  structured JSON-логи (pino), метрики Prometheus (`/api/metrics`), graceful shutdown.
- Атомарный checkout в Mongo-транзакции (с graceful-фолбэком без replica set).
- Socket.IO Redis-adapter (горизонтальное масштабирование чата).
- Хранилище медиа: `StorageProvider` (S3/Noop) + `POST /media/upload-url` (presigned).
- Платёжный вебхук `POST /payments/webhook` (идемпотентный) + refund.
- Покупательский флоу main-web: корзина, чекаут, история и трекинг заказов.
- Реальная роль пользователя на фронте через `GET /auth/me`.
- SEO: `sitemap.xml`, `robots.txt`, мета/OpenGraph-теги; легальные CMS-страницы
  (about/terms/privacy) + футер.
- Версионирование API по URI: `/api/v1/...` (+ `/api/...` как алиас совместимости).

### Notes
- Полноценная атомарность транзакций требует MongoDB replica set (в dev — фолбэк).
- Реальная доставка SMS, онлайн-оплата, загрузка в S3, Sentry, Redis и хостинг
  требуют внешних аккаунтов/инфраструктуры (см. внутренний provisioning-чеклист).
