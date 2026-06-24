# UI-kit — заметки переноса React → Angular (Stage 1)

Источник: `_input/` (React-кит BRICK) + `_input/Brick (Copy).fig` (Figma).
Цель: Angular standalone + Angular Material + Tailwind, стили только через дизайн-токены.

## Маппинг токенов (React → design-tokens)
React-кит использовал «полные» цветовые переменные (`var(--brick-orange)`), наш
`design-tokens` хранит цвета **RGB-каналами** (для alpha в Tailwind):

| React | Angular (наш) |
|---|---|
| `var(--brick-orange)` | `rgb(var(--color-brick-orange))` / Tailwind `bg-accent` |
| `var(--text-primary)` | `rgb(var(--color-text-primary))` / `text-text-primary` |
| `var(--glass-fill)`, `var(--border-default)`, `--shadow-*`, `--radius-*`, `--space-*`, `--fs-*`, `--fw-*`, `--font-*`, `--type-*` | имена сохранены |
| `var(--glass-blur-sm)` | `--blur-glass-sm` (Tailwind `backdrop-blur-glass-sm`) |

Никаких хардкод-цветов: все значения — через токены/Tailwind-пресет, который ссылается
на те же CSS-переменные. Правка `tokens.json` → перегенерация `tokens.css` → меняет и
Tailwind-классы, и Angular Material (`material-bridge.css`) одновременно (есть тест).

## Перенос: паттерны
- `useState/props` → `input()` сигналы; колбэки → `output()`; `children` → `ng-content`;
  условный рендер → `@if/@for`; инлайн-стили → Tailwind-классы на токенах (+ `[style.*]` для
  динамики: размеры, цвет логотипа, box-shadow аватара).
- Все компоненты `standalone`, `ChangeDetectionStrategy.OnPush`, префикс `bh-`.

## Перенесено (Stage 1, core)
Button, IconButton, Badge, Tag, Avatar, Rating, Logo.

## Исправленные баги/улучшения исходника
- **Tag**: в React был `<span role="button">` без клавиатурной доступности и с `onClick`
  на вложенном `<span>` для удаления → переписан на настоящий `<button>` + `aria-pressed`;
  удаление — отдельный управляемый элемент с `aria-label`, обработка Enter/Space.
- **Кнопки/иконки**: добавлены видимые focus-кольца (`focus-visible:outline`), `aria-label`/
  `aria-pressed` у IconButton, `disabled`-состояния.
- **Avatar/Logo**: `role="img"`/`aria-label`; инициалы как безопасный фолбэк.
- **Rating**: `role="img"` + агрегированный `aria-label` («4.5 of 5») вместо немых SVG.

## Сверка с Figma
- `.fig` — бинарный файл Figma (~34 MB); напрямую агентом не парсится. Источником значений
  служил **извлечённый из Figma** слой токенов и React-компоненты (так и задумано в кит-ридми:
  «Tokens … extracted directly from it»). Расхождений токенов с React-китом не выявлено.
- **TODO для ручной сверки в Figma** (где приоритет у Figma per Foundations §5а): точные тени
  карточек товара/комнаты и hover-микроанимации (в `.fig` могут отличаться нюансы тайминга).

## Не сделано в этом проходе (продолжение Stage 1)
- Компоненты forms (Input, SearchBar, Select, Checkbox, Radio, Switch, QuantityStepper),
  feedback (Modal, Toast), navigation (Tabs, Breadcrumb), marketplace (ProductCard, RoomCard,
  CategoryCard, FeatureBar, Navbar, Footer).
- Компонент-тесты на каждый компонент + тест-харнесс ui-kit (`@angular/build:unit-test` для
  библиотеки), тесты адаптивности (брейкпоинты/overflow).
- Полные навигационные шеллы 3 приложений + гейт входа по роли (заготовка показа ui-kit
  сейчас в `vendor-web`).
