# Деплой Brickam в AWS (ECS Fargate)

Полный гайд по сборке Docker-образов и деплою Brickam в AWS: продакшен —
в ECS Fargate за ALB (`.github/workflows/deploy-ecs.yml`), стейджинг —
по SSH через docker compose (`.github/workflows/cd.yml`).

Связанные файлы репозитория:

- CI: `.github/workflows/ci.yml`
- CD (GHCR + стейджинг по SSH): `.github/workflows/cd.yml`
- Прод-деплой в ECS: `.github/workflows/deploy-ecs.yml`
- Dockerfile'ы: `infra/Dockerfile.server`, `infra/Dockerfile.main-web`,
  `infra/Dockerfile.vendor-web`, `infra/Dockerfile.admin-web`
- ECS-шаблоны и инструкция: `infra/ecs/README.md`,
  `infra/ecs/task-definition.server.json` (+ `*.main-web/vendor-web/admin-web`)
- Рантайм-конфиги фронтов: `infra/config/README.md`, `infra/config/config.*.prod.json`
- Прод-настройки сервера (несекретные): `config/production.toml`
- Секреты/env: `.env.example`

## Предпосылки (создаётся один раз, владельцем)

- **AWS-аккаунт** и регион (например, `eu-central-1`).
- **ECR-репозитории**: `brickam-server`, `brickam-main-web`,
  `brickam-vendor-web`, `brickam-admin-web`.
- **ECS cluster** (например, `brickam-cluster`) на Fargate.
- **ALB + target group(s)** для сервиса(ов); терминация TLS (ACM-сертификат),
  HTTPS-листенеры.
- **OIDC-роль для GitHub Actions** (`brickam-gha-deploy-role`): trust на
  `token.actions.githubusercontent.com`; политики `ecr:*` (push),
  `ecs:RegisterTaskDefinition` / `ecs:UpdateService` / `ecs:RunTask`,
  `iam:PassRole` на роли задач. ARN → секрет `AWS_ROLE_ARN`. Долгоживущие
  AWS-ключи не используются.
- **IAM-роли задач**:
  - `brickam-ecs-execution-role` — `AmazonECSTaskExecutionRolePolicy` +
    inline `secretsmanager:GetSecretValue` на ARN секретов.
  - `brickam-server-task-role` — доступ приложения к S3, SES; для X-Ray
    sidecar — `AWSXRayDaemonWriteAccess`.
- **Secrets Manager**: секреты `brickam/prod/*` (jwt, twilio, arca, idram,
  sentry-dsn, s3, mongo-uri, redis-url) — см. `secrets[]` в
  `infra/ecs/task-definition.server.json`.
- **MongoDB Atlas** (replica set — обязательно для транзакций checkout).
- **ElastiCache Redis** (refresh/OTP-сторы, Socket.IO adapter, BullMQ).
- **S3** — бакет под медиа; **SES** — отправка писем (`providers.email=ses`).
- **CloudWatch log group** `/ecs/brickam-server` (или `awslogs-create-group:true`).

## GitHub Secrets / Variables

Имена сверены с `.github/workflows/deploy-ecs.yml` и `cd.yml`.

### Для прод-деплоя в ECS (`deploy-ecs.yml`)

| Имя | Назначение |
|-----|-----------|
| `AWS_REGION` | регион AWS (напр. `eu-central-1`) |
| `AWS_ROLE_ARN` | ARN OIDC-роли GitHub Actions |
| `ECS_CLUSTER` | имя ECS-кластера (напр. `brickam-cluster`) |
| `ECS_TASKDEF_SERVER` | имя/ARN task-def сервера для one-off миграций (напр. `brickam-server`) |
| `ECS_SUBNETS` | подсети для миграционной задачи: `subnet-AAA,subnet-BBB` |
| `ECS_SECURITY_GROUPS` | security groups: `sg-XXX` |
| `ECS_SERVICE_SERVER` | имя ECS-сервиса `server` |
| `ECS_SERVICE_MAIN_WEB` / `ECS_SERVICE_VENDOR_WEB` / `ECS_SERVICE_ADMIN_WEB` | имена сервисов фронтов (когда раскомментируете их в matrix `deploy`) |

Job'ы `migrate` и `deploy` используют GitHub Environment `production`
(можно навесить required reviewers / защиты).

### Для GHCR + стейджинга (`cd.yml`)

| Имя | Назначение |
|-----|-----------|
| `GITHUB_TOKEN` | встроенный — пуш образов в GHCR (`packages: write`) |
| `STAGING_HOST` | хост стейджинга (если пусто — деплой пропускается) |
| `STAGING_USER` | SSH-пользователь |
| `STAGING_SSH_KEY` | приватный SSH-ключ |
| `SENTRY_DSN` | DSN мониторинга ошибок (прокидывается в рантайм) |

Job `deploy-staging` использует Environment `staging`.

## Как работает CI (`ci.yml`)

Триггеры: PR в `main` и пуш в любые ветки кроме `main`. Один job `validate` на
Ubuntu (Node 22): `npm ci` → `nx-set-shas` (база для affected) → Biome (формат+линт
всего репо) → ESLint (affected) → typecheck/build (affected) → тесты (affected,
порог покрытия ≥80%) → e2e `server-e2e` (in-process, без Mongo/Redis). Тестовые
секреты заданы прямо в `env` workflow — реальная инфраструктура не нужна.
Включите branch protection: required status check = `CI / validate`.

## Как работает CD стейджинга (`cd.yml`)

Триггер: пуш в `main`. Job `build-push` (matrix `server`, `main-web`,
`vendor-web`, `admin-web`) собирает образы по `infra/Dockerfile.<app>` через
Buildx с кэшем GHA и пушит в GHCR двумя тегами: `:${{ github.sha }}` и `:latest`.
Затем `deploy-staging`: если задан `STAGING_HOST`, по SSH на хосте выполняется
`docker compose -f docker-compose.staging.yml pull && up -d` и health-check —
ждёт ответа `http://localhost:3000/api/health` (до 30 попыток × 3с). Без
`STAGING_HOST` шаг помечается пропущенным (образы всё равно опубликованы).

## Сборка Docker-образов

- `infra/Dockerfile.server` — multi-stage (`node:22-alpine`): `npm ci` →
  `nx build server`; runtime копирует `dist/apps/server`, `node_modules`,
  `config`; ставит `ffmpeg` (рендер видео); порт `3000`; `CMD ["node","main.js"]`;
  HEALTHCHECK по `/api/health`.
- `infra/Dockerfile.main-web` — Angular SSR (Node): `nx build main-web`; runtime
  на Node, порт `4000`, `CMD ["node","server/server.mjs"]`.
- `infra/Dockerfile.vendor-web` / `infra/Dockerfile.admin-web` — Angular CSR:
  `nx build <app>`; runtime `nginx:alpine`, статика из `dist/apps/<app>/browser`,
  конфиг `infra/nginx.conf`, порт `80`.

Фронты читают конфигурацию в рантайме из `/assets/config.json` — подменяйте
`config.<app>.prod.json` из `infra/config/` (с подстановкой `<DOMAIN>`), см.
`infra/config/README.md`. Один образ годен для любого окружения.

## First-time setup (первый прод-деплой)

1. **Создайте инфраструктуру** из раздела «Предпосылки»: ECR, кластер, ALB +
   target group, IAM-роли (включая OIDC), Secrets Manager, Atlas, ElastiCache,
   S3, SES, CloudWatch log group.
2. **Заполните секреты** `brickam/prod/*` в Secrets Manager и пропишите их ARN
   в `infra/ecs/task-definition.server.json` (плейсхолдеры `<ACCOUNT_ID>`,
   `<REGION>`, `<ECR_REGISTRY>`, `...-XXXXXX`). JWT-секреты — длинные случайные
   (см. `SECURITY.md`). `MONGO_URI` — Atlas replica set.
3. **Заполните несекретные прод-настройки** `config/production.toml`
   (`corsOrigins`, выбор провайдеров) и `CORS_ORIGINS`/`<DOMAIN>` в task-def.
4. **Заведите GitHub Secrets/Variables** из таблицы выше.
5. **Зарегистрируйте task definition** (вычистив `_comment*`-ключи; см.
   `infra/ecs/README.md` п.1):
   ```bash
   jq 'walk(if type=="object" then with_entries(select(.key|startswith("_comment")|not)) else . end)' \
     infra/ecs/task-definition.server.json > /tmp/td.server.json
   # подставьте реальные <ACCOUNT_ID>/<REGION>/<ECR_REGISTRY>
   aws ecs register-task-definition --cli-input-json file:///tmp/td.server.json
   ```
6. **Соберите и запушьте первый образ** в ECR (можно через ручной запуск
   workflow `Deploy ECS`, который сделает build-push сам).
7. **Создайте ECS-сервис** за ALB (`infra/ecs/README.md` п.2):
   `aws ecs create-service ... --desired-count 2 --load-balancers ...`.
8. **Настройте health-check target group**: path `/api/health/ready`, port 3000,
   success `200`. Контейнерный health-check бьёт по `/api/health/live`.
9. **Прогоните миграции** one-off задачей (см. ниже / `docs/SEED.md`).
10. **Запустите деплой** workflow `Deploy ECS` и дождитесь стабилизации сервиса.

## Регулярный релиз (через `deploy-ecs.yml`)

Запуск вручную (`workflow_dispatch`, опционально с `image_tag`; по умолчанию тег
= `github.sha`). Последовательность job'ов:

1. **`build-push`** (matrix `server` + 3 web): OIDC-логин → `amazon-ecr-login` →
   `docker/build-push-action` по `infra/Dockerfile.<app>` → пуш в ECR тегами
   `:${tag}` и `:latest`.
2. **`migrate`** (Environment `production`): one-off ECS-задача на образе server
   с переопределением команды на `npm run migrate`; ждёт `tasks-stopped` и
   проверяет `exitCode == 0` (иначе релиз падает). Запускается ДО `deploy`.
3. **`deploy`** (matrix; по умолчанию только `server`): вычищает `_comment*` из
   шаблона (`jq`), подставляет новый образ
   (`amazon-ecs-render-task-definition`), регистрирует task-def и обновляет
   сервис (`amazon-ecs-deploy-task-definition`, `wait-for-service-stability:
   true`). Фронты подключаются по аналогии — раскомментируйте элементы matrix и
   заведите секреты сервисов + шаблоны task-def.

Ручной аналог прогона миграций и проверок — в `infra/ecs/README.md` (п.4) и
`docs/SEED.md`.

## Проверка работоспособности (health)

Глобальный префикс API — `api` (см. `apps/server/src/main.ts`), поэтому пробы:

- **`GET /api/health`** — общий статус сервиса (без пинга зависимостей; для
  обратной совместимости; этим же путём пользуется HEALTHCHECK в
  `Dockerfile.server` и health-check стейджинга в `cd.yml`).
- **`GET /api/health/live`** — liveness: процесс жив, без БД/Redis. Используется
  контейнерным health-check ECS (`task-definition.server.json`).
- **`GET /api/health/ready`** — readiness: пингует Mongo и Redis; при
  недоступности зависимости возвращает `503`. Используется target group ALB.

После деплоя убедитесь, что сервис `RUNNING`, target group `healthy`, и
`/api/health/ready` отвечает `200`.

## Откат (rollback)

- **Через ECS** — обновите сервис на предыдущую ревизию task definition:
  ```bash
  aws ecs update-service --cluster brickam-cluster --service <service> \
    --task-definition brickam-server:<PREV_REVISION> --force-new-deployment
  ```
- **Через workflow** — перезапустите `Deploy ECS` с `image_tag` = sha
  предыдущего хорошего релиза (образы остаются в ECR; `render-task-definition`
  подставит старый образ).
- **Миграции** — необратимы автоматически: добавление индексов безопасно для
  старого кода; при необходимости отката данных пишите отдельную миграцию.
  Поэтому деплойте обратносовместимые изменения схемы.
- `wait-for-service-stability: true` не даст релизу «зелёнеть», пока новые
  задачи не стабилизируются — при провале здоровья откат запускайте сразу.
