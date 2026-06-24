# ▶ STAGE 4 — Каталог + SEO
Выполни ТОЛЬКО Stage 4. Foundations §12, §13, §15.

**Цель:** товары на продажу, обложка фото/видео, поиск/фильтры, SEO.

**Сделай:** `feature/catalog`.
- Сущности `categories`, `products` (из §15; БЕЗ rental — только продажа). `cover.mediaType` image|video + `gallery`, `discount?{type,value,окно}`, `attributes`, `embedding` (заполняется в Stage 13).
- CRUD товаров/категорий на `BaseCrudService/Controller`; mapped-types DTO.
- Поиск/фильтры (категория, цена, поставщик, рейтинг, наличие, регион), сортировка, **серверная пагинация** (`PaginationQueryDto`/`PaginatedDto`). Текстовый индекс по title/description.
- `main-web`: листинг + карточка товара. Видео-обложка: автоплей muted loop во вьюпорте, `thumbnailUrl`-фолбэк; на mobile — нативный плеер (учтётся в Stage 19).
- Валидация загружаемого медиа по `platform_settings.media` (форматы/размер/длительность/размеры).
- **SEO:** Angular SSR-сервис (`@angular/ssr`); на edge/nginx — детект бот-UA (список из `platform_settings.seo.botUserAgents`)→SSR, люди→CSR; пререндер каталожных/товарных маршрутов; `meta/OG`, `sitemap.xml`, `robots.txt`.

**Тесты:** юнит фильтров/пагинации/цены-со-скидкой; e2e поиск/фильтр/карточка; тест видео-vs-фото обложки+фолбэк; тест маршрутизации бот→SSR / человек→CSR; тест валидации медиа по лимитам.

**✓ Чек-лист:**
- [ ] каталог ищется/фильтруется/пагинируется (серверно)
- [ ] обложка-видео работает с фолбэком; лимиты медиа применяются
- [ ] бот получает SSR-HTML, человек — CSR; sitemap/robots отдаются
- [ ] тесты/покрытие ок

