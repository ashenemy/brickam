# Политика безопасности Brickam

Этот документ описывает, как сообщить об уязвимости, какие версии
поддерживаются, и какие меры защиты применяются в платформе Brickam.

## Как сообщить об уязвимости

Если вы обнаружили уязвимость, **не создавайте публичный GitHub Issue**.
Сообщите приватно:

- Email: `security@<domain>` (замените `<domain>` на рабочий домен платформы).
- В письме укажите: описание проблемы, шаги воспроизведения (PoC), затронутые
  компоненты/эндпоинты, оценку влияния, ваши контакты.

Что вы можете ожидать:

- Подтверждение получения — в течение 3 рабочих дней.
- Первичная оценка и план реакции — в течение 7 рабочих дней.
- Скоординированное раскрытие после выпуска исправления.

Пожалуйста, дайте разумное время на устранение до публичного раскрытия и не
эксплуатируйте уязвимость дальше, чем нужно для подтверждения (без доступа к
чужим данным, без деградации сервиса).

## Поддерживаемые версии

Платформа разрабатывается в едином Nx-монорепозитории и выкатывается одной
версией (rolling release). Исправления безопасности выпускаются только для
**текущей основной ветки `main`** и актуального продакшен-релиза.

| Версия | Поддержка исправлениями безопасности |
|--------|--------------------------------------|
| `main` / актуальный прод-релиз | Да |
| Любые предыдущие сборки/теги    | Нет (обновитесь до актуальной)       |

## Обзор мер безопасности

Меры реализованы в коде сервера (`apps/server`) и инфраструктуре (`infra/`).
Ключевые точки:

- **Аутентификация JWT (access/refresh).** Раздельные секреты
  `JWT_ACCESS_SECRET` и `JWT_REFRESH_SECRET`. Refresh-сторы хранятся в Redis
  (`RedisModule`) для консистентности между инстансами.
- **httpOnly-cookie + dual-mode.** Токены передаются через httpOnly-cookie ИЛИ
  заголовок `Authorization: Bearer` (`cookie-parser` подключается в
  `apps/server/src/main.ts`). На проде reverse-proxy ставит API и фронт на один
  домен, cookie выдаются с `Domain=.<domain>` (`COOKIE_DOMAIN`) — без cross-site.
- **RBAC / permissions.** Доступ к маршрутам ограничен ролями и правами;
  публичные маршруты помечаются декоратором `@Public()`.
- **Rate-limiting (throttler).** Глобальный лимит 100 req/мин на IP
  (`ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])` в
  `apps/server/src/app/app.module.ts`); на auth-маршрутах лимиты строже через
  `@Throttle`. Health-пробы выведены из-под лимита (`@SkipThrottle`).
  Для корректного клиентского IP за ALB включён `trust proxy`.
- **Security-заголовки (helmet).** `helmet()` подключён в `main.ts`
  (CSP отключён намеренно, чтобы не ломать Swagger UI; API отдаёт JSON).
- **Валидация DTO.** Входные данные валидируются (`class-validator` /
  `class-transformer`, а также `zod`) — недоверенный ввод отклоняется до бизнес-логики.
- **Редактирование секретов в логах.** Структурное JSON-логирование (pino)
  редактирует чувствительные поля: `req.headers.authorization`,
  `req.headers.cookie`, `res.headers["set-cookie"]` (см. `LoggerModule` в
  `app.module.ts`).
- **Идемпотентность платежей/мутаций.** `IdempotencyModule` обрабатывает
  заголовок `Idempotency-Key` для `@Idempotent`-маршрутов; ключи хранятся в
  коллекции `idempotency_keys` с уникальным индексом и TTL 24ч
  (`tools/migrate/src/index-specs.ts`).
- **Проверка подписи вебхуков.** Колбэки PSP (ArCa / Idram) проверяются по
  подписи/секрету мерчанта (`ARCA_*`, `IDRAM_SECRET_KEY`) до изменения статуса
  заказа.
- **Graceful shutdown.** `enableShutdownHooks()` корректно закрывает
  Mongo/Redis/BullMQ по SIGTERM/SIGINT.
- **Мониторинг ошибок.** Sentry/GlitchTip (`SENTRY_DSN`), метрики Prometheus
  (`/api/metrics`), трассировка AWS X-Ray (sidecar в ECS task definition).

## Требования к секретам в проде

- **JWT-секреты** (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`) — длинные
  случайные строки (например, `openssl rand -base64 48`), разные для access и
  refresh. Никогда не используйте dev-значения из `.env.example`
  (`change-me-*`).
- **Хранение секретов** — только в **AWS Secrets Manager** (или SSM Parameter
  Store), подключаются в ECS через `secrets[]` task definition
  (`infra/ecs/task-definition.server.json`). В репозиторий и образы секреты не
  попадают; `.env` не коммитится.
- **Доступ приложения к AWS** (S3, SES) — через IAM task role, а не статические
  ключи, где это возможно.
- **MongoDB / Redis** — строки подключения с паролем держите в `secrets`, а не в
  `environment`. `MONGO_URI` должен указывать на replica set (нужно для
  транзакций checkout).
- **Ротация.** Секреты ротируются при компрометации и периодически; после
  ротации перевыкатывайте сервис (новый запуск task подтянет новые значения).

## Чеклист безопасного деплоя

- [ ] `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — уникальные длинные случайные,
      лежат в Secrets Manager (не dev-плейсхолдеры).
- [ ] Все секреты PSP, Twilio, S3, Sentry, Mongo/Redis — в Secrets Manager,
      ARN прописаны в task definition; нет секретов в `environment`/образе/гите.
- [ ] OIDC-роль GitHub Actions (`AWS_ROLE_ARN`) имеет минимально необходимые
      права (ECR push, ECS deploy, `iam:PassRole` только на нужные роли); нет
      долгоживущих AWS-ключей в репозитории.
- [ ] `CORS_ORIGINS` / `corsOrigins` ограничены реальными доменами фронтов
      (`https://<domain>`, `https://vendor.<domain>`, `https://admin.<domain>`).
- [ ] `COOKIE_DOMAIN` задан корректно (`.<domain>`); cookie — httpOnly, secure.
- [ ] HTTPS/TLS терминируется на ALB; helmet/HSTS активны; внутренний трафик в
      VPC, `assignPublicIp=DISABLED`.
- [ ] Подпись вебхуков PSP проверяется; идемпотентность мутаций включена.
- [ ] Health-пробы настроены (`/api/health/ready` на target group ALB,
      `/api/health/live` — контейнерный health-check).
- [ ] Логи не содержат секретов (redact активен); включён мониторинг
      (Sentry/GlitchTip, Prometheus).
- [ ] Миграции прогнаны как one-off task до обновления сервиса; индексы созданы.
- [ ] Зависимости без известных критичных CVE (регулярный `npm audit` /
      Dependabot).
