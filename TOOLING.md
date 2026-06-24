# Линтинг/формат: Biome + ESLint, без Prettier

Prettier НЕ устанавливать (`prettier`, `eslint-plugin-prettier`, `eslint-config-prettier` — нет).

| Зона | Владелец |
|---|---|
| Форматирование (отступы 4 пробела, одинарные кавычки) | Biome (единолично) |
| Линт общего TS/JS (correctness/suspicious/complexity) | Biome linter |
| Angular-правила (шаблоны/компоненты) | ESLint (`angular-eslint`) |
| Границы Nx, циклы импортов | ESLint (`@nx/enforce-module-boundaries`) |
| Type-aware правила | ESLint (`typescript-eslint`) |

Правила бесконфликтности:
1. В ESLint отключить ВСЕ стилистические/форматирующие правила (никаких `@stylistic/*`).
2. В Biome отключить lint-правила, дублирующие Angular/Nx-правила ESLint (точечно, если всплывут встречные автофиксы).
3. ESLint скоупить на `**/*.ts` и `**/*.html`. Biome форматирует весь TS/JS/JSON.
4. Порядок в CI/хуках: `biome check` → `eslint`. Никогда не запускать два автофикса на одни правила.
5. `$schema` в biome.json привести к версии установленного Biome.
