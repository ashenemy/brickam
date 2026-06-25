# tools/seed — идемпотентный сид BuildHub

Единственная команда наполняет MongoDB убедительными демо-данными. Повторный
запуск **не плодит дублей** (Stage 14, Foundations §15/§19).

## Запуск

```bash
# из корня монорепо
MONGO_URI=mongodb://localhost:27017/buildhub npm run seed
# или напрямую через Nx
MONGO_URI=mongodb://localhost:27017/buildhub npx nx run seed:seed
```

Команда `seed` сначала собирает TypeScript (`build` → `tsc -p tsconfig.lib.json`),
затем запускает `node dist/main.js`. `main.ts` читает `MONGO_URI` из env,
коннектит mongoose, применяет датасет через `MongoSeedStore` и печатает отчёт.

## Архитектура

- **Чистые билдеры** (`src/builders/*`) генерируют датасет — массивы документов
  со стабильными строковыми id (`vendor_<slug>`, `cat_<slug>`, `prod_<slug>`,
  `user_<phone>` …) и согласованными перекрёстными ссылками. Без сети, без
  `Math.random`/`Date.now` — время передаётся явно (`SeedClock`).
- **`SeedStore`** (`src/store.ts`) — абстракция хранилища:
  `upsert(collection, key, doc) → 'inserted' | 'updated'`.
  - `MongoSeedStore` — продакшен: `updateOne(key, { $set, $setOnInsert }, { upsert: true })`.
  - `InMemorySeedStore` — тестовая (Map по `collection + JSON(key)`).
- **`runSeed(store, clock?)`** (`src/run-seed.ts`) — применяет весь датасет,
  возвращает `SeedReport` (per-collection counts + inserted/updated).

## Идемпотентность

Каждая запись несёт стабильный `key` (slug / phone / number / id), а не
автогенерируемый `_id`. Повторный `upsert` находит документ по этому ключу и
обновляет его (`updated`), а не вставляет новый. `_id` детерминирован из ключа.

## Тесты (без Mongo)

`npx nx test seed` гоняет `runSeed` на `InMemorySeedStore`:

- идемпотентность (двойной прогон → те же размеры коллекций, второй прогон =
  `updated`);
- объём (80–150 товаров, есть скидки и видео-обложки);
- целостность всех перекрёстных ссылок;
- непустые локали hy/ru/en;
- ровно один `platform_settings` с непустым `seo.botUserAgents`.

## Коллекции

`categories`, `vendors`, `users`, `products`, `reviews`, `chats`, `messages`,
`invoices`, `exchange_rates`, `templates`, `loyaltyprograms`,
`platform_settings`.
