# CI/CD (Foundations §17)

Два пайплайна GitHub Actions.

## CI — `ci.yml`
Триггер: PR в `main` и пуш в любую не-`main` ветку. Шаги:

1. `npm ci`
2. **Biome** — `biome check .` (формат + базовый lint, весь репозиторий)
3. **ESLint** — `nx affected -t lint` (type-aware правила + границы модулей)
4. **Typecheck/Build** — `nx affected -t build` (компиляция TS = типизация)
5. **Test** — `nx affected -t test` (vitest; пороги покрытия **lines ≥ 80 / branches ≥ 70** заданы в `*/vitest.config.mts` → непокрытие валит job)
6. **E2E** — `nx e2e server-e2e` (in-process, без Mongo/Redis)

Сборка/тесты — только для затронутого (`nx affected`, база/голова через `nrwl/nx-set-shas`).

### Блокировка мерджа
Включите **branch protection** для `main`:
- Settings → Branches → Add rule → Branch name `main`.
- ✅ *Require status checks to pass before merging* → выберите **`CI / validate`**.
- ✅ *Require branches to be up to date*.

Тогда любой красный шаг (упавший тест **или** недобор покрытия) делает проверку
красной → кнопка merge заблокирована. Это и есть проверка «падение тестов/
покрытия блокирует мерж» (Foundations §17).

## CD — `cd.yml`
Триггер: пуш в `main` (после прохождения CI). Шаги:

1. **build-push** (матрица `server`/`main-web`/`vendor-web`/`admin-web`): сборка
   образа из `infra/Dockerfile.<app>` и публикация в **GHCR**
   (`ghcr.io/<owner>/buildhub-<app>:<sha>` + `:latest`), кэш слоёв через GHA.
2. **deploy-staging**: по SSH на стейджинг-хост — `docker compose -f
   docker-compose.staging.yml pull && up -d`, затем health-check `GET /api/health`
   (до 30 попыток). Выполняется только если задан секрет `STAGING_HOST`; иначе
   шаг пропускается (образы всё равно опубликованы).

### Секреты (Settings → Secrets and variables → Actions)
- `GITHUB_TOKEN` — авто (push в GHCR, `permissions: packages: write`).
- `STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_KEY` — доступ к стейджинг-хосту.
- `SENTRY_DSN` — прокидывается в рантайм сервера (env). Прочие провайдер-ключи
  (`ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`, …) — там же, читаются конфигом из env.

Health-checks заданы и в образах (`HEALTHCHECK` в `infra/Dockerfile.server`) и в
`docker-compose*.yml` (server `/api/health`).
