# Brickam — стартовый комплект

Порядок запуска:
1. Дай Claude Code файл `KICKOFF_PROMPT.md` (вставь как первое сообщение) вместе с
   `brickam_foundations_v8.md` и `brickam_stages_v8.md`.
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
- brickam_foundations_v8.md  справочник (читать первым)
- brickam_stages_v8.md ...... план по стейджам

## Промпты по стейджам (для автономной работы)
- `brickam_stage_prompts_v8.md` — все 20 промптов в одном файле (копируй блоки по порядку)
- `stage-prompts/stage00.md … stage19.md` — те же промпты отдельными файлами
Порядок: Stage 0 → 19. Каждый вставляешь как сообщение в Claude Code, ждёшь отчёт по ✓, идёшь дальше.
Для быстрого демо: Stage 0–5, затем 14 (сид), затем база 15.


#AWS

##Предусловия                                                                                                                                                                                                                     
                                                                                                                                                                                                                                 
  - Node 22, Docker Desktop.                                                                                                                                                                                                      
  - .env уже есть в корне (я его сгенерировал; Nx подхватывает его автоматически для всех таргетов). Для чистого клона: cp .env.example .env.                                                                                     
  - npm install        
 Вариант A — Dev-режим (рекомендую: hot-reload, моки, всё кликается)                                                                                                                                                             
                                                                                                                                                                                                                                  
  1. Поднять только данные в Docker                                                                                                                                                                                               
                                                                                                                                                                                                                                  
  docker compose up -d mongo redis minio minio-init                                                                                                                                                                               
  Это Mongo (27017), Redis (6379), MinIO (9000 API / 9001 консоль). Мониторинг/GlitchTip не нужны.                                                                                                                                
                                                                                                                                                                                                                                  
  ▎ Mongo одиночный (не replica set) — это ок: TransactionRunner сам деградирует до записи без транзакции (разовый warning в логах). Checkout работает.                                                                           
                                                                                                                                                                                                                                  
  2. Миграции и сид (создаёт индексы + демо-данные)                                                                                                                                                                               
                                                                                                                                                                                                                                  
  npm run migrate   # = nx run migrate:migrate (индексы из INDEX_SPECS)                                                                                                                                                           
  npm run seed      # = nx run seed:seed (категории/вендоры/товары/демо-юзеры)       


3. API (отдельный терминал)                                                                                                                                                                                                     
                                                                                                                                                                                                                                  
  npx nx serve server                                                                                                                                                                                                             
  NODE_ENV не задан → по умолчанию development → development.toml (sms=mock, payment=mock, CORS на localhost:4200–4202, CSRF off, обычные cookie). API: http://localhost:3000/api, Swagger: http://localhost:3000/api/docs.       
                                                                                                                                                                                                                                  
  4. Фронты (по терминалу на каждый; порты важны — под них настроен CORS)                                                                                                                                                         
                                                                                                                                                                                                                                  
  npx nx serve main-web   --port 4200    # покупатели (SSR)                                                                                                                                                                       
  npx nx serve vendor-web --port 4201    # кабинет продавца                                                                                                                                                                       
  npx nx serve admin-web  --port 4202    # админка                                                                                                                                                                                
  Их public/assets/config.json уже указывает на http://localhost:3000/api/v1 — менять ничего не нужно.                                                                                                                            
                                                                                                                                                                                                                                  
  Что где открыть                                                                                                                                                                                                                 
                           
                           
                           
 ┌────────────────────────────────────────┬───────────────────────────────────────────────────────────┐                                                                                                                          
  │                  URL                   │                            Что                            │                                                                                                                          
  ├────────────────────────────────────────┼───────────────────────────────────────────────────────────┤                                                                                                                          
  │ http://localhost:4200                  │ main-web (покупатели)                                     │                                                                                                                          
  ├────────────────────────────────────────┼───────────────────────────────────────────────────────────┤                                                                                                                          
  │ http://localhost:4201                  │ vendor-web (продавцы)                                     │                                                                                                                          
  ├────────────────────────────────────────┼───────────────────────────────────────────────────────────┤                                                                                                                          
  │ http://localhost:4202                  │ admin-web (админка)                                       │                                                                                                                          
  ├────────────────────────────────────────┼───────────────────────────────────────────────────────────┤                                                                                                                          
  │ http://localhost:3000/api/docs         │ Swagger                                                   │                                                                                                                          
  ├────────────────────────────────────────┼───────────────────────────────────────────────────────────┤                                                                                                                          
  │ http://localhost:3000/api/health/ready │ health (Mongo+Redis)                                      │                                                                                                                          
  ├────────────────────────────────────────┼───────────────────────────────────────────────────────────┤                                                                                                                          
  │ http://localhost:9001                  │ MinIO консоль (brickam-local / brickam-local-s3-secret) │                                                                                                                          
  └────────────────────────────────────────┴───────────────────────────────────────────────────────────┘                                                                                                                          
                                                                                                                                                                                                                                  
  Как логиниться без реального SMS                                                                                                                                                                                                
                                                                                                                                                                                                                                  
  sms=mock → код OTP печатается в логи nx serve server. Берёшь его оттуда и вводишь. payment=mock → оплата проходит без PSP. Демо-учётки — из сида (tools/seed).   

Вариант B — Полный стек в Docker (smoke-тест прод-образов)
  
  docker compose up --build
  Поднимает всё: данные + server + 3 web + Prometheus(9090)/Alertmanager(9093)/Grafana(3001)/GlitchTip(8000). Порты web: main 4000, vendor 4201, admin 4202.
  
  ⚠️ Здесь сервер в NODE_ENV=production: грузит production.toml (нужны реальные ключи PSP/Twilio или фолбэк на mock), CORS только на боевые домены, secure-cookie не работают по http. Это проверка сборки образов и /api/health,
  а не e2e-кликанья.
  
  Чтобы полный Docker-стек тоже кликался — в docker-compose.yml у сервиса server поставь NODE_ENV: development и добавь в config/development.toml corsOrigins строку http://localhost:4000. Тогда заработают моки и cookie по
  http.
  
  Поднять подмножество (без мониторинга):                                                      
  docker compose up --build mongo redis minio minio-init server main-web vendor-web admin-web 
  
  
  ---                                                                                                                                                                                                                             
    Полезные команды                                                                                                                                                                                                                
                                                                                                                                                                                                                                    
    npm test                 # все юнит-тесты (nx run-many -t test)                                                                                                                                                                 
    npm run lint             # biome + eslint                                                                                                                                                                                       
    npm run build            # прод-сборка всех проектов                                                                                                                                                                            
    npx nx serve server      # только API                                                                                                                                                                                           
    docker compose down      # остановить стек (данные в volume сохранятся)                                                                                                                                                         
    docker compose down -v   # + удалить данные (чистый старт)                                                                                                                                                                      
                                                                                                                                                                                                                                    
    ---                                                                                                                                                                                                                             
    Короткий путь «всё и сразу» для разработки                                                                                                                                                                                      
                                                                                                                                                                                                                                    
    docker compose up -d mongo redis minio minio-init                                                                                                                                                                               
    npm run migrate && npm run seed                                                                                                                                                                                                 
    # дальше 4 терминала:                                                                                                                                                                                                           
    npx nx serve server                                                                                                                                                                                                             
    npx nx serve main-web --port 4200                                                                                                                                                                                               
    npx nx serve vendor-web --port 4201                                                                                                                                                                                             
    npx nx serve admin-web --port 4202                                                                                                                                                                                              
    Открываешь localhost:4200, логинишься по OTP-коду из логов сервера — и тестируешь сценарии (каталог → корзина → checkout → mock-оплата, кабинет вендора, админку).       
