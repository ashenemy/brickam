# Brickam — Foundations (v8) · справочник для Claude Code

> Маркетплейс стройматериалов (Армения). Этот файл — постоянный справочник: архитектура, конвенции, бизнес-правила, модель данных, настройки. План работ — в `brickam_stages_v8.md` (стейджами). Foundations скармливается агенту один раз; затем идём по стейджам.

## Изменения объёма (зафиксировано)
**Убрано:** эскроу, аренда (только продажа), тендеры. **Каталог — товары на продажу.** Калькуляторы материалов остаются.

## 1. Приложения и архитектура
- **3 Angular-приложения:** `main-web` (публичка+покупатель), `vendor-web` (кабинет продавца), `admin-web` (админка) — разные сабдомены/деплои.
- **`server`** — NestJS, модульный монолит; доменная логика в мелких **feature-пакетах**.
- **`mobile`** — NativeScript+Angular (последним).
- **Изоляция:** Nx tags (`type:app|feature|kit|domain`, `scope:main|vendor|admin|server|shared`) + `@nx/enforce-module-boundaries`. `feature` не импортирует другой `feature` напрямую — только через контракты/события `domain-kit`.

```
apps/ main-web/ vendor-web/ admin-web/ server/ mobile/
packages/
  core-kit/ config-kit/ db-kit/ server-kit/ api-kit/ auth-kit/ state-kit/
  i18n-kit/ design-tokens/ ui-kit/ mobile-ui-kit/ ai-kit/ domain-kit/
  feature/ auth/ users/ vendors/ vendor-members/ catalog/ orders/ payments/
           wishlist/ reviews/ chat/ invoices/ calculators/ currency/
           loyalty/ subscriptions/ templates/ pages/ vendor-bulk/
           ai-search/ ai-assistant/ notifications/ analytics/ disputes/
tools/seed/  config/  infra/
```

## 2. Стек
Nx (layout `packages/`) · Angular (standalone, signals) + Angular Material + Tailwind · NativeScript+Angular · NestJS (ООП) · MongoDB+Mongoose, Atlas Vector Search · Auth: телефон+пароль+OTP, JWT access+refresh · Socket.IO · Swagger/OpenAPI · i18n hy(дефолт)/ru/en · **Biome+ESLint без Prettier; 4 пробела; одинарные кавычки в TS** · AI за провайдерами · S3+CDN · Docker/CI-CD.

## 3. Конвенции кода
1. `type` вместо `interface` (кроме declaration merging/`implements`).
2. Максимум ООП: классы, абстрактные базы в пакетах, DI, маленькие классы, композиция.
3. Все типы модуля — в `src/@types/index.ts` (один баррель на пакет/feature).
4. DTO с валидацией и Mongoose-сущности — классы.
5. Сторонние npm-модули разрешены и поощряются; внешние сервисы — за интерфейсами.
6. Strict TS; контракты из `domain-kit` без дублирования.

## 4. Тулинг (Biome+ESLint, без Prettier)
Формат — только Biome: `indentStyle="space"`, `indentWidth=4`, `javascript.formatter.quoteStyle="single"` (JSON — двойные). Зоны: форматирование+общий TS/JS-линт → Biome; Angular-правила, границы Nx, type-aware → ESLint. В ESLint выключить стилистику; в Biome выключить правила, дублирующие ESLint; порядок `biome check`→`eslint`; без двойных автофиксов. Матрица — в `CONTRIBUTING.md`.

## 5. Дизайн-токены (единый источник)
`packages/design-tokens/src/tokens.json` (цвета RGB-каналами для альфы + spacing/radius/typography) → `tokens.css` (`:root{--color-primary:…}`). Tailwind: `rgb(var(--color-primary)/<alpha-value>)`. Material 3: проброс в `--mat-sys-*`. Mobile: импорт токенов как TS. Правка одного файла → изменения везде.

## 5а. Исходный React UI-kit → перенос на Angular+Material+Tailwind
**Вход:** есть уже сгенерированный UI-кит на **React**. Его НЕ использовать как есть — он служит дизайн-референсом и источником компонентов/токенов.
**Задача переноса (выполняется в Stage 1):**
- Каждый React-компонент → **Angular standalone-компонент** в `packages/ui-kit`. React-паттерны заменить на Angular: hooks/state → **signals**, props → `input()`, события → `output()`, children → `ng-content`.
- Где есть аналог — использовать **Angular Material**; стилизация — **Tailwind** через **дизайн-токены** (никаких хардкод-цветов/размеров: вытащить палитру/spacing/радиусы из React-кита в `design-tokens`, дальше всё через `var(--…)`).
- **Исправить ошибки** исходного кита (баги, неверная типизация, несостыковки состояний) и **довести адаптивность/респонсивность** (mobile-first, корректные брейкпоинты, отсутствие переполнений).
- Доступность (a11y: роли, фокус, контраст), три языка, покрытие компонент-тестами.
- Сверить с Figma при наличии; при расхождении React-кита и Figma — приоритет у Figma, расхождения зафиксировать.
**Расположение исходника:** агент ожидает React-кит в `/_input/react-ui-kit/` (или путь, который укажет пользователь). Нет исходника — запросить до Stage 1.

## 6. Переиспользуемые DTO
Декорированная сущность-источник правды (`@Prop`+`@ApiProperty`+class-validator) → производные DTO через mapped-types (`PartialType/PickType/OmitType/IntersectionType`). Фронт берёт типы из `domain-kit` и/или генерит `api-kit` из OpenAPI. Дублирование запрещено.

## 7. Generic-инфраструктура
`BaseRepository<T>` · `BaseCrudService<T,C,U>` (хуки) · `BaseCrudController<T,C,U>` (фабрика+Swagger) · `PaginatedDto<T>` (`{data,meta:{page,pageSize,total,totalPages,hasNext,hasPrev}}`) · `PaginationQueryDto` · `ApiResponse<T>`. Composite-декораторы: `@Auth(...perms)`, `@ApiPaginatedOk(model)`, `@CurrentUser()`, `@CurrentVendor()`, `@Serialize(Dto)`.

## 8. Перехватчики и ошибки
Interceptors: `RequestContext`(traceId)→`Logging`→`Timeout`→`ClassSerializer`→`ResponseTransform`. Успех `{success:true,data,meta?}`; ошибка `{success:false,error:{code,message,details?,traceId}}`. `AppException{code,httpStatus,messageKey,details?}`+i18n; подклассы базовые (422/401/403/404/409/429) и доменные. Машинный `ErrorCode`-каталог. Глобальный `ValidationPipe` (whitelist+forbidNonWhitelisted+transform).

## 9. Swagger
`/api/docs`, `/api/docs-json`, Bearer, теги по модулям. OpenAPI — источник генерации `api-kit`. CI проверяет генерацию.

## 10. Конфигурация: TOML/env vs админ-настройки
- **Деплой-тайм/инфра (TOML+env):** порты, CORS, секреты, выбор провайдеров, лимиты пагинации, **commissionPercent**, базовая валюта, фиче-флаги. Парсинг `smol-toml`, валидация на старте (fail-fast), типизированный `AppConfigService`. Фронты — рантайм `assets/config.json` через `APP_INITIALIZER`.
- **Рантайм-настройки из админки (БД):** шаблоны писем/SMS/страниц, правила лояльности, ограничения видео/изображений, промпт-шаблоны AI-генерации, список бот-UA для SEO. Хранятся в `platform_settings` и доменных коллекциях. **Никаких таких значений в коде.**

## 11. Бизнес-правила (зафиксировано; спорные дефолты помечены ★)
- **Эскроу — нет.** Оплата проходит обычным платежом.
- **Платёж:** покупатель платит **один платёж**, он **разбивается по вендорам** (`payments.splits`).
- **Комиссия:** берётся **с продавца**, считается на **сумму позиции после скидки**, в **AMD**, округление до целого драма. `commissionAmount = round(vendorSubtotalAfterDiscount * commissionPercent/100)`; `payout = vendorSubtotalAfterDiscount − commissionAmount`.
- **Лояльность — конструктор:** программа имеет `basis = total_spend | order_count` и упорядоченные **уровни** `tiers[]` (порог + тип скидки percent|amount + значение). Текущий уровень покупателя = максимальный, чей порог ≤ его метрики. Скидка авто-применяется на оформлении к сумме заказа после товарных скидок (percent — от суммы, amount — фикс AMD, не ниже 0). Метрика обновляется при завершении заказа (`loyalty_ledger`). Активна одна программа (поддержать расписание active-окна).
  - ★ **Кто несёт скидку лояльности:** по умолчанию — **платформа** (уменьшает её маржу), комиссия вендора считается до скидки лояльности, выплата вендору не страдает. Подтвердить/изменить.
- **Подписки:** план `free|pro`, **сейчас без функциональных различий**; структура `subscription_plans.limits/features` готова для будущих ограничений.
- **Скидки на товар:** `percent|amount`, опц. окно действия; влияют на комиссию (после скидки).
- **Валюта:** хранение и расчёты — в AMD; отображение — с конвертацией (курсы ЦБ Армении + фолбэк).

## 12. SEO: SSR только для ботов (dynamic rendering)
- `main-web` по умолчанию CSR. Поднять **Angular SSR** (`@angular/ssr`) как отдельный рендер-сервис.
- На edge (nginx/Node-прокси): детект user-agent поисковиков → проксировать на SSR/prerender; людям — статический CSR-бандл. Список бот-UA — в `platform_settings.seo.botUserAgents` (редактируется из админки).
- Рекомендуется дополнительно **пререндерить каталожные/товарные маршруты** для скорости. `meta`/`title`/Open Graph и `sitemap.xml`/`robots.txt` — генерировать.
- ★ Свериться с актуальными рекомендациями Google (тренд — SSR с гидрацией для всех); bot-only оставлен как выбранный подход.

## 13. Медиа и AI-генерация (настройки в админке)
- **Обложка товара — изображение ИЛИ видео** (`cover.mediaType`). Видео — автоплей без звука в зацикле во вьюпорте (web)/нативный плеер (mobile), `thumbnailUrl`-фолбэк.
- **Ограничения видео/изображений — в `platform_settings.media`** (редактируются админом): allowedFormats, maxSizeMb, maxDurationSec, maxWidth/Height, autoTranscode. Валидация на загрузке. Транскодинг/превью — ffmpeg.
- **AI-генерация — промптом для встроенного ИИ:** продавец задаёт промпт; генерация = **базовый промпт-шаблон из `platform_settings.aiPrompts`** (descriptionTemplate/imageTemplate/videoTemplate, правятся в админке) + промпт продавца + контекст товара. Описание — LLM; картинка — image-провайдер; видео-превью — ffmpeg-слайдшоу/опц. video-API; всё через `ai_jobs` (асинхронно). Результат может стать видео-обложкой.

## 14. Роли и права
buyer(individual|company) · vendor_owner · vendor_member (`orders.view | products.manage | analytics.view | chat.handle | invoices.create`) · admin. `PermissionsGuard`+`@Auth(...perms)`; `*hasPermission` на фронте; запросы scoped по вендору. Вход в каждое web-приложение гейтится по роли.

## 15. Модель данных (коллекции MongoDB)
Mongoose-схемы со строгой типизацией, индексами и валидацией. `timestamps:true` везде.

- **users**: role, accountType, name, phone★unique, phoneVerified, passwordHash(@Exclude), lang, status(active|blocked), loyalty{currentTierId?, totalSpend, totalOrders}
- **vendors**: ownerUserId, companyName, slug★unique, description{hy,ru,en}, logoUrl, region, ratingAvg, ratingCount, subscriptionTier(free|pro), status(pending|approved|blocked)
- **vendor_members**: vendorId, userId, permissions[], status(active|invited|disabled)
- **categories**: parentId?, slug★unique, name{hy,ru,en}, icon, calculatorType?, order
- **products**: vendorId, categoryId, slug★unique, title{hy,ru,en}, description{hy,ru,en}, cover{mediaType(image|video),url,thumbnailUrl}, gallery[{mediaType,url,thumbnailUrl}], price(AMD), discount?{type(percent|amount),value,activeFrom?,activeTo?}, unit, stock, region, status(draft|active|hidden), attributes[{key,value}], embedding[vector], ratingAvg, ratingCount, viewsCount — индексы: text(title,description), vector(embedding), categoryId, vendorId
- **carts**: buyerId★unique, items[{productId,vendorId,qty,priceSnapshot,discountSnapshot}]
- **delivery_addresses**: userId, label, region, city, line1, line2?, phone, isDefault
- **orders**: orderNumber★unique, buyerId, status(created|paid|processing|completed|cancelled), subtotal, productDiscountTotal, loyaltyDiscount, total, currencyShown, paymentId?, deliveryAddressSnapshot, loyaltyTierSnapshot?, createdAt
- **vendor_orders** (саб-заказ на вендора): orderId, vendorId, items[{productId,titleSnapshot,qty,unitPrice,discountApplied,lineTotal}], subtotal, commissionPercentSnapshot, commissionAmount, payoutAmount, deliveryStatus(accepted|picked|in_transit|delivered|cancelled), deliveryEvents[{status,at,note?}]
- **payments**: orderId, buyerId, amount(AMD), provider, providerRef?, status(pending|succeeded|failed|refunded), splits[{vendorId,amount,commissionAmount,payoutAmount}]
- **wishlists**: userId★unique, items[{productId,addedAt}]
- **reviews**: orderId, vendorOrderId, buyerId, vendorId, productId?, rating(1-5), text, status(published|hidden)
- **chats**: buyerId, vendorId, participants[{userId,role}], lastMessageAt, unread{buyer,vendor}
- **messages**: chatId, senderId, type(text|invoice|file|system), text?, attachmentUrl?, invoiceId?, readBy[], createdAt
- **invoices**: invoiceNumber★unique, chatId, vendorId, buyerId, lineItems[{title,qty,price}], discount?{type,value}, subtotal, total, currency, validUntil, status(draft|sent|paid|expired|cancelled), orderId?, pdfUrl
- **loyalty_programs**: name, isActive, activeFrom?, activeTo?, basis(total_spend|order_count), tiers[{level,name,threshold,discountType(percent|amount),discountValue}]
- **loyalty_ledger**: userId, orderId, metric(amount|order), delta, reason, createdAt
- **subscriptions**: vendorId, tier(free|pro), startedAt, expiresAt?, status(active|expired|cancelled)
- **subscription_plans**: tier★unique, name, priceAmd, limits{}, features[]
- **templates**: key★unique, type(email|sms), name, subject{hy,ru,en}?, content{hy,ru,en}, variables[], isActive, version, updatedBy
- **pages**: slug★unique, title{hy,ru,en}, body{hy,ru,en}, status(draft|published), updatedBy
- **exchange_rates**: base(AMD), rates{}, source, fetchedAt
- **media_assets**: ownerType, ownerId, mediaType(image|video), url, thumbnailUrl, sizeBytes, width, height, durationSec?, format
- **ai_jobs**: vendorId, productId?, type(description|image|video), prompt, params, status(queued|processing|done|failed), resultUrl?, error?
- **platform_settings**: key★unique, value(json), scope — (media, aiPrompts, seo.botUserAgents и пр.)
- **disputes**: orderId, vendorOrderId?, openedBy, reason, status(open|in_review|resolved|rejected), messages[], resolution?
- **audit_logs**: actorId, action, entityType, entityId, meta, createdAt

## 16. Сторонние сервисы (за провайдер-интерфейсами; выбор в `[providers]`; проверить доступность под Армению)
MongoDB Atlas(+Vector Search) · SMS: Twilio/Infobip/Vonage(+локальный арм.) · Хранилище+CDN: S3/CloudFront/R2/Spaces · LLM: Anthropic Claude · Embeddings: Voyage/OpenAI/Cohere · Изображения: fal.ai/Replicate/Stability · Видео: ffmpeg/Replicate/Runway · Очередь: BullMQ+Redis · Realtime: Socket.IO(+Redis-adapter) · Курсы: ЦБ Армении(cba.am)+фолбэк · Платежи (Армения): Idram/Telcell/ArCa/банк-эквайринг (Stripe ограничен) · Мониторинг: Sentry · Почта: Resend/Postmark/SES.

## 17. DevOps и коммиты
Docker: `Dockerfile.server`, `Dockerfile.main-web`, `Dockerfile.vendor-web`, `Dockerfile.admin-web` (build→nginx), `docker-compose.yml` (Mongo+Redis+server+3 web). Окружения dev/staging/prod (`config/{env}.toml`+секреты CI). CI: `biome check→eslint→typecheck→test→nx affected build→docker→deploy staging`, `nx affected`, health `/api/health`, Sentry. **Коммиты:** Conventional Commits, **scope=имя проекта Nx** (один app/один package), `commitlint`+scope-enum; хук `pre-commit` (`biome check --staged`→`eslint`→**guard единственного проекта**), `commit-msg`(`commitlint`).

## 18. Политика тестирования (покрываем все модули)
- **Каждый feature-пакет и kit поставляется с тестами** как часть «готово».
- Юнит (Jest) на сервисы/репозитории/калькуляторы/ошибки/DTO-дженерики; Angular-компонент-тесты для `ui-kit` и критичных экранов; интеграционные/e2e (supertest для API, Playwright для web) на критпуть: auth/OTP, заказ+разбивка платежа+комиссия, расчёт скидки лояльности, инвойс, каталог/поиск.
- **Порог покрытия в CI: ≥80% строк** на feature/kit-пакетах (критические — выше). PR без зелёных тестов и порога не проходит.
- В каждом стейдже тесты входят в задачи и в чек-лист готовности.
