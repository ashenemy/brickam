# tools/migrate — версионированные миграции БД BuildHub

Единая команда применяет версионированные, идемпотентные миграции к MongoDB:
создание индексов сейчас и трансформы данных в будущем. Применённые миграции
отслеживаются в коллекции `migrations`.

В проде `autoIndex` выключен (db-kit) — индексы НЕ строятся на старте приложения.
Их создаёт миграция `0001-initial-indexes`.

## Запуск

```bash
# из корня монорепо
MONGO_URI=mongodb://localhost:27017/buildhub npm run migrate
# или напрямую через Nx
MONGO_URI=mongodb://localhost:27017/buildhub npx nx run migrate:migrate
```

Команда `migrate` сначала собирает TypeScript (`build` → `tsc -p tsconfig.lib.json`),
затем запускает `node dist/main.js`. `main.ts` читает `MONGO_URI`, коннектит
mongoose, применяет непримененные миграции через `MongoMigrationDb` и печатает
отчёт.

## Архитектура

- **`INDEX_SPECS`** (`src/index-specs.ts`) — КАНОНИЧЕСКИЙ список индексов, заданный
  ЯВНО (а не выведенный из ODM). Это и документация, и источник истины,
  независимый от схем фич. Имена коллекций — фактические имена в MongoDB.
- **`MigrationDb`** (`src/types.ts`) — абстракция БД, нужная миграциям:
  `createIndex(collection, keys, options?)`, `applied()`, `markApplied(id, description)`.
  - `MongoMigrationDb` (`src/mongo-db.ts`) — продакшен поверх mongoose-соединения.
    Журнал — коллекция `migrations` (`_id` = id миграции).
  - `InMemoryMigrationDb` (`src/db.ts`) — тестовая (множества indexes + applied).
- **`Migration`** (`src/types.ts`) — `{ id, description, up(db) }`. Миграции лежат
  в `src/migrations/` отдельными файлами с возрастающими id; реестр —
  `src/migrations/index.ts` (`MIGRATIONS`, отсортированы по id).
- **`runMigrations(db)`** (`src/run-migrations.ts`) — грузит applied, для каждой
  миграции по порядку: если id не применён → `up(db)` + `markApplied`. Возвращает
  `MigrationReport { applied, skipped }`.

## Идемпотентность

Двухуровневая:

1. **Журнал `migrations`**: `runMigrations` пропускает уже применённые id
   (повторный прогон → всё в `skipped`, `up` не вызывается).
2. **Сами операции**: `createIndex` идемпотентен — MongoDB не пересоздаёт
   идентичный индекс (тот же ключ + опции).

## Добавление миграции

Создайте `src/migrations/0002-<описание>.ts` с `Migration` (id `'0002-...'`) и
зарегистрируйте в `src/migrations/index.ts`. Для новых индексов добавляйте записи
в `INDEX_SPECS` и применяйте их новой миграцией (старые миграции не меняются).

## Тесты (без Mongo)

`npx nx test migrate` гоняет `runMigrations` на `InMemoryMigrationDb`:

- идемпотентность (0001 применяется один раз; повтор → всё skipped);
- 0001 создаёт ожидаемые индексы (products.slug-unique, text-индекс и т.д.);
- `markApplied`/`applied` трекают id;
- `INDEX_SPECS`: уникальные где надо (products.slug, users.phone, …), TTL у
  `idempotency_keys`.
