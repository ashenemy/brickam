# Миграции и seed-данные Brickam

Пошаговая инструкция: как создать индексы (миграции) и залить демо-данные (seed)
в MongoDB — локально, на стейджинге и в проде (AWS ECS).

Инструменты лежат в:

- `tools/migrate` — миграции БД (создание индексов; журнал в коллекции `migrations`).
- `tools/seed` — заливка демо-сущностей (идемпотентный upsert).

## Предусловия

1. **MongoDB как replica set.** Приложение использует транзакции (например,
   checkout), а они работают только на replica set. Даже одиночный узел должен
   быть инициализирован как RS (`rs.initiate()`), иначе сид/работа с
   транзакциями упадут с ошибкой `Transaction numbers are only allowed on a
   replica set member or mongos`.
2. **Redis** — поднят (нужен приложению; для самих миграций/сида не обязателен,
   но окружение обычно поднимается целиком).
3. **Заполненный `.env`** (скопируйте из `.env.example`), в первую очередь
   `MONGO_URI`. Пример: `MONGO_URI=mongodb://localhost:27017/brickam`.
   Оба инструмента читают строку подключения **только** из переменной окружения
   `MONGO_URI` и завершатся с ошибкой, если она не задана.
4. **Установлены зависимости**: `npm ci`.

## Команды

Из корня репозитория:

```bash
# 1) Сначала миграции (создают индексы)
npm run migrate     # = nx run migrate:migrate

# 2) Затем seed (демо-данные)
npm run seed        # = nx run seed:seed
```

Эквивалентные прямые вызовы Nx-таргетов:

```bash
nx run migrate:migrate
nx run seed:seed
```

Как это устроено (см. `tools/*/project.json`): таргеты `migrate`/`seed` зависят
от `build` (`dependsOn: ["build"]`), то есть Nx сначала компилирует TypeScript
(`tsc -p tsconfig.lib.json` в `dist/`), затем запускает `node dist/main.js` в
каталоге инструмента. `MONGO_URI` берётся из окружения процесса.

> **Порядок важен:** сначала `migrate`, потом `seed`. Миграции создают
> уникальные индексы (`slug`, `phone`, `orderNumber`, `invoiceNumber`,
> `idempotency_keys.key` и т.д.); сид опирается на согласованную схему.

## Что создаёт `migrate`

Миграции применяются по порядку из `tools/migrate/src/migrations/index.ts`.
Единственная начальная миграция — `0001-initial-indexes`
(`tools/migrate/src/migrations/0001-initial-indexes.ts`): она создаёт все
канонические индексы из `tools/migrate/src/index-specs.ts`. В проде `autoIndex`
выключен, поэтому индексы строит именно эта миграция.

Среди прочего создаются:

- `products`: уникальный `slug`, индексы по `vendorId`/`categoryId`/`status` и
  полнотекстовый индекс `products_text` по локализованным `title.*`/`description.*`
  (hy/ru/en).
- `categories`: уникальный `slug`, индекс по `parentId`.
- `vendors`: уникальный `slug`, индексы по `ownerUserId`/`status`.
- `users`: уникальный `phone`.
- `reviews`: уникальный `vendorOrderId`, индексы по `vendorId`/`productId`.
- `orders` / `vendororders`: уникальный `orderNumber`, индексы по
  `buyerId`/`vendorId`/`orderId`/`createdAt`.
- `chats` / `messages` / `invoices`: индексы по участникам/чату, уникальный
  `invoiceNumber`.
- `exchange_rates`, `loyaltyprograms`, `loyaltyledgers`, `ai_jobs`, `disputes`,
  `audit_logs`, `subscriptions`, `vendormembers`, `pages`, `platform_settings`.
- `idempotency_keys`: уникальный `key` + TTL-индекс `idempotency_keys_ttl`
  (записи живут 24ч / 86400с после `createdAt` и автоматически удаляются).

Отчёт после прогона показывает применённые/пропущенные миграции:

```
Migration report:

  applied (1): 0001-initial-indexes
  skipped (0): —
```

## Что создаёт `seed`

Сид собирает полный датасет (`tools/seed/src/dataset.ts`) из билдеров
(`tools/seed/src/builders/*`) и применяет его через `MongoSeedStore` идемпотентным
upsert по стабильному `key`. Создаются (в порядке отчёта):

`categories` → `vendors` → `users` → `products` → `reviews` → `chats` /
`messages` / `invoices` → `exchange_rates` → `templates` → `loyaltyprograms` →
`platform_settings` → `pages`.

Рейтинги отзывов согласованно вмерживаются в товары и вендоров
(`ratingAvg`/`ratingCount` берутся из агрегата по `reviews`). Время сидирования
фиксируется один раз за прогон (детерминированные `createdAt`/`updatedAt`).

Отчёт после прогона:

```
Seed report:

  categories           total=...  inserted=...  updated=...
  vendors              total=...  inserted=...  updated=...
  ...
  TOTAL                total=...  inserted=...  updated=...
```

## Идемпотентность

Оба инструмента можно запускать повторно без вреда:

- **migrate** — журнал в коллекции `migrations`: уже применённые id попадают в
  `skipped`, `up()` не вызывается. Повторное создание идентичного индекса в
  MongoDB — no-op.
- **seed** — upsert по стабильному `key`: повторный прогон даёт `updated`
  вместо `inserted`, дубли не появляются.

## Запуск в проде / на ECS (one-off task)

В проде миграции прогоняются **отдельной разовой ECS-задачей** на образе
сервера, ДО обновления сервиса. В CI это делает шаг `migrate` в
`.github/workflows/deploy-ecs.yml` (переопределение команды контейнера на
`npm run migrate`).

Ручной запуск (см. также `infra/ecs/README.md`):

```bash
aws ecs run-task \
  --cluster brickam-cluster \
  --task-definition brickam-server \
  --launch-type FARGATE \
  --network-configuration 'awsvpcConfiguration={subnets=[subnet-AAA,subnet-BBB],securityGroups=[sg-XXX],assignPublicIp=DISABLED}' \
  --overrides '{"containerOverrides":[{"name":"server","command":["npm","run","migrate"]}]}' \
  --started-by "manual-migrate"
```

Дождитесь статуса `STOPPED` с `exitCode: 0`:

```bash
aws ecs wait tasks-stopped --cluster brickam-cluster --tasks <TASK_ARN>
aws ecs describe-tasks --cluster brickam-cluster --tasks <TASK_ARN> \
  --query 'tasks[0].containers[0].exitCode' --output text
```

`MONGO_URI` берётся из `secrets[]` task definition (Secrets Manager), отдельно
задавать не нужно.

> Seed демо-данными в проде, как правило, **не запускают** — он предназначен для
> dev/стейджинга/демо. Если нужно — выполните аналогичной one-off задачей с
> `command: ["npm","run","seed"]` (после миграций) и осознанно.

## Частые ошибки

- **`MONGO_URI не задан`** — переменная окружения пуста. Заполните `.env` /
  передайте `MONGO_URI` в окружение процесса/задачи.
- **Транзакции падают (`Transaction numbers are only allowed on a replica set
  member or mongos`)** — Mongo запущена не как replica set. Инициализируйте RS
  (`rs.initiate()`) или используйте Atlas (там RS по умолчанию).
- **Ошибка уникального индекса при повторном/частичном сиде** — в коллекциях
  остались несогласованные данные с конфликтующими `slug`/`phone`/`*Number`.
  Очистите коллекцию или приведите данные в соответствие, затем повторите.
- **Сид запущен раньше миграций** — индексы ещё не созданы. Соблюдайте порядок:
  `migrate` → `seed`.
