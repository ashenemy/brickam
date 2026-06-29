# AGENTS.md — Brickam AI Coding Guide

Маркетплейс стройматериалов (Армения). Nx-монорепо: 3 Angular-приложения + NestJS API + ~20 feature-пакетов.

## Архитектура

```
apps/          main-web (покупатели, :4200) · vendor-web (продавцы, :4201) · admin-web (:4202) · server (:3000)
packages/      core-kit · db-kit · server-kit · api-kit · auth-kit · state-kit · ui-kit · domain-kit
               feature/{auth,users,vendors,catalog,orders,payments,cart,chat,invoices,calculators,…}
config/        default.toml · development.toml · production.toml   (без секретов; секреты в .env)
tools/         seed/ · migrate/ · openapi/ · hooks/
```

**Граница изоляции:** `feature` не импортирует другой `feature` напрямую — только через `domain-kit` (события/контракты). Нарушение ловит ESLint `@nx/enforce-module-boundaries`. Nx tags: `type:app|feature|kit|domain`, `scope:main|vendor|admin|server|shared`.

## Запуск (dev)

```bash
# 1. Инфра
docker compose up -d mongo redis minio minio-init

# 2. Данные
npm run migrate   # nx run migrate:migrate — индексы из INDEX_SPECS
npm run seed      # nx run seed:seed — категории / вендоры / товары / демо-пользователи

# 3. API + фронты (4 терминала)
npx nx serve server
npx nx serve main-web   --port 4200
npx nx serve vendor-web --port 4201
npx nx serve admin-web  --port 4202
```

OTP при `sms=mock` (dev) → код в логах `nx serve server`. Оплата при `payment=mock` проходит без PSP.
Swagger: `http://localhost:3000/api/docs` · Health: `http://localhost:3000/api/health/ready`

## Ключевые команды

```bash
npm run biome:check       # проверка форматирования (запускать перед lint)
npm run biome:fix         # автофикс форматирования
npm run lint              # nx run-many -t lint (ESLint по всем проектам)
npm test                  # nx run-many -t test (Vitest, порог ≥80% строк)
npm run build             # прод-сборка всех проектов
npm run api-kit:generate  # export OpenAPI → Orval → packages/api-kit (после изменений контроллеров)
npx nx affected -t test   # тесты только затронутых проектов (быстро)
```

## Конвенции кода

- **`type` вместо `interface`** — кроме declaration merging и `implements`.
- **Максимум ООП:** классы, абстрактные базы в пакетах (`BaseCrudService`, `BaseRepository`), DI.
- **Все типы модуля** — в `src/@types/index.ts` (один баррель на пакет/feature).
- **DTO:** decorated-класс = источник правды (`@Prop` + `@ApiProperty` + class-validator); производные через `PartialType/PickType/OmitType`. Дублирование запрещено.
- **Контракты** берутся из `domain-kit`, типы фронта генерятся через `api-kit` из OpenAPI.
- **Strict TS** (`strict: true`); 4 пробела; одинарные кавычки в TS, двойные в JSON.

## Тулинг (Biome + ESLint, без Prettier)

| Зона | Владелец |
|---|---|
| Форматирование, общий TS/JS-линт | **Biome** |
| Angular-правила, Nx-границы, type-aware | **ESLint** |

Порядок в CI/хуках: `biome check` → `eslint`. **Prettier не устанавливать.**

## Generic-инфраструктура (server-kit / core-kit)

- `BaseCrudController<T,C,U>` + `BaseCrudService<T,C,U>` + `BaseRepository<T>` — основа каждого feature-модуля.
- Ответ всегда `{success:true,data,meta?}` / `{success:false,error:{code,message,details?,traceId}}`.
- Interceptors в порядке: `RequestContext` → `Logging` → `Timeout` → `ClassSerializer` → `ResponseTransform`.
- Composite-декораторы: `@Auth(...perms)`, `@ApiPaginatedOk(model)`, `@CurrentUser()`, `@Serialize(Dto)`.
- Пагинация: `{data, meta:{page,pageSize,total,totalPages,hasNext,hasPrev}}`.

## Коммиты

Conventional Commits, **scope = имя Nx-проекта** (`feat(catalog): …`). Один коммит — один проект (хук `tools/hooks/single-scope-guard.mjs`). Pre-commit: `biome check --staged` → `eslint` → scope-guard.

## Бизнес-критичные правила

- Хранение и расчёты — **AMD** (армянский драм). Отображение с конвертацией (курсы cba.am).
- Комиссия берётся **с продавца** от суммы позиции **после скидки**: `commissionAmount = round(subtotal * rate/100)`.
- Скидка лояльности несёт **платформа** (комиссия вендора считается до неё).
- Платёж один, разбивается по вендорам (`payments.splits`).
- **Рантайм-настройки** (промпты AI, шаблоны писем, лимиты медиа, бот-UA для SEO) — только в `platform_settings` (MongoDB). Не хардкодить в код.

## Ключевые файлы для чтения

- `brickam_foundations_v8.md` — полный справочник: архитектура, конвенции, модель данных, бизнес-правила.
- `brickam_stages_v8.md` + `stage-prompts/` — план работ по 20 стейджам.
- `packages/server-kit/src/index.ts` — экспорты generic CRUD-инфраструктуры.
- `packages/core-kit/src/index.ts` — AppException, ErrorCode, Result, Guards.
- `packages/domain-kit` — контракты между feature-пакетами.
- `config/development.toml` — dev-настройки (mock-провайдеры, CORS, лимиты).

