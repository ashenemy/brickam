# BuildHub — стартовый комплект

Порядок запуска:
1. Дай Claude Code файл `KICKOFF_PROMPT.md` (вставь как первое сообщение) вместе с
   `buildhub_foundations_v8.md` и `buildhub_stages_v8.md`.
2. Положи React-UI-kit в `/_input/react-ui-kit/` и дай ссылку на Figma (для Stage 1).
3. Скопируй `.env.example` → `.env`, заполни секреты по мере подключения сервисов.
4. Агент начинает со Stage 0; стартовые конфиги ниже он переносит в корень репо.

Файлы конфигурации:
- biome.json ............ формат 4 пробела, одинарные кавычки
- TOOLING.md ............ матрица Biome vs ESLint (без конфликтов)
- config/*.toml ......... деплой-тайм настройки (без секретов)
- .env.example ......... секреты
- commitlint.config.cjs  обязательный scope в коммитах
- lefthook.yml ......... pre-commit (biome→eslint→scope-guard) + commit-msg
- tools/hooks/single-scope-guard.mjs  один проект на коммит
- nx.json .............. layout packages/ + targets
- eslint.boundaries.snippet.mjs  границы модулей (feature ↛ feature)
- tsconfig.base.strict.snippet.json  строгий TS

Документы:
- buildhub_foundations_v8.md  справочник (читать первым)
- buildhub_stages_v8.md ...... план по стейджам

## Промпты по стейджам (для автономной работы)
- `buildhub_stage_prompts_v8.md` — все 20 промптов в одном файле (копируй блоки по порядку)
- `stage-prompts/stage00.md … stage19.md` — те же промпты отдельными файлами
Порядок: Stage 0 → 19. Каждый вставляешь как сообщение в Claude Code, ждёшь отчёт по ✓, идёшь дальше.
Для быстрого демо: Stage 0–5, затем 14 (сид), затем база 15.
