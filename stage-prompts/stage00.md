# ▶ STAGE 0 — Каркас и DevOps-фундамент
Продолжаем сборку BuildHub. Foundations = `buildhub_foundations_v8.md` (закон). Выполни ТОЛЬКО Stage 0.

**Цель:** рабочий монорепо, на котором всё последующее само соблюдает стандарты.

**Сделай:**
- Инициализируй Nx-воркспейс (integrated), layout `packages/` (см. `nx.json` из стартера). Создай apps `main-web`, `vendor-web`, `admin-web` (Angular standalone), `server` (NestJS).
- Перенеси стартовые конфиги в корень: `biome.json`, `config/*.toml`, `.env.example`, `commitlint.config.cjs`, `lefthook.yml`, `tools/hooks/single-scope-guard.mjs`, `tsconfig.base` (strict-сниппет), eslint flat-config с `@nx/enforce-module-boundaries` (см. сниппет). Проставь Nx tags каждому проекту (`type:*`, `scope:*`).
- `packages/config-kit`: загрузка TOML (`smol-toml`) + deep-merge по `NODE_ENV` + overlay env; валидация конфига на старте (fail-fast); типизированный `AppConfigService`. Для фронтов — рантайм `assets/config.json` + `APP_INITIALIZER`.
- `packages/core-kit`: абстрактный `AppException{code,httpStatus,messageKey,details?}`, enum `ErrorCode` (каталог из Foundations §8), подклассы ошибок, `Result`-тип, утилиты.
- `packages/server-kit`: глобальные interceptors в порядке RequestContext(traceId)→Logging→Timeout→ClassSerializer→ResponseTransform; `AllExceptionsFilter` (конверт ошибки); глобальный `ValidationPipe` (whitelist+forbidNonWhitelisted+transform); `PaginatedDto<T>`, `PaginationQueryDto`, `ApiResponse<T>`; composite-декораторы `@Auth(...perms)`, `@ApiPaginatedOk(model)`, `@CurrentUser()`, `@CurrentVendor()`, `@Serialize(Dto)`; абстрактные `BaseCrudService<T,C,U>`, `BaseCrudController<T,C,U>`.
- `packages/db-kit`: подключение Mongo (URI из env), `BaseSchema`, generic `BaseRepository<T>` (find/findPaginated/create/update/delete).
- Swagger на `/api/docs` (+`/api/docs-json`); настрой генерацию `packages/api-kit` из OpenAPI (orval/openapi-generator).
- `packages/i18n-kit`: каркас словарей hy/ru/en + ключи ошибок.
- `infra/`: `Dockerfile.server`, `Dockerfile.main-web|vendor-web|admin-web` (build→nginx), `docker-compose.yml` (Mongo+Redis+server+3 web). `/api/health`.

**Тесты:** юнит — валидация конфига (нет обязательного → падение), `BaseRepository` (CRUD+пагинация), `ResponseTransformInterceptor`, `AllExceptionsFilter` (маппинг AppException→конверт); смоук-e2e `/api/health`.

**✓ Чек-лист:**
- [ ] монорепо собирается; `biome check` и `eslint` зелёные, без взаимных конфликтов
- [ ] границы Nx работают (нарушение импорта падает)
- [ ] коммит из 2 проектов отклоняется guard-хуком; commitlint требует scope
- [ ] конфиг грузится из TOML+env, валидируется на старте; фронты читают рантайм-конфиг
- [ ] унифицированный конверт успеха/ошибки работает; ошибки локализуемы
- [ ] Swagger открыт; `api-kit` генерится из OpenAPI
- [ ] `docker-compose up` поднимает стек; `/api/health` отвечает
- [ ] тесты зелёные, покрытие ≥80%

Отчёт по чек-листу. Для Stage 1 мне понадобится положить React-UI-kit в `/_input/react-ui-kit/` и дать Figma — напомни об этом.

