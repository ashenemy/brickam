# Прод-конфиги фронтов (runtime config.json)

Фронты (`main-web`, `vendor-web`, `admin-web`) читают конфигурацию **в рантайме**
из `/assets/config.json` (а не из сборки), поэтому один и тот же образ можно
деплоить в любое окружение, подменив один файл.

В репозитории dev-вариант лежит в `apps/<app>/public/assets/config.json`
(`apiBaseUrl = http://localhost:3000/api/v1`). Здесь — **прод-варианты**.

## Файлы

| Файл | Для образа | Монтируется/копируется в |
|------|-----------|--------------------------|
| `config.main-web.prod.json`   | main-web (SSR, :4000)   | `/app/browser/assets/config.json` |
| `config.vendor-web.prod.json` | vendor-web (nginx, :80) | `/usr/share/nginx/html/assets/config.json` |
| `config.admin-web.prod.json`  | admin-web (nginx, :80)  | `/usr/share/nginx/html/assets/config.json` |

> Путь внутри SSR-образа может отличаться (`browser/assets` vs `assets`) —
> сверьтесь со структурой `dist/apps/main-web` после `nx build`.

## Перед деплоем

Замените плейсхолдер `<DOMAIN>` на реальный домен (см. `infra/nginx.reverse-proxy.conf`):

```bash
# пример: подставить домен и записать в конечный файл
sed 's/<DOMAIN>/example.com/g' infra/config/config.main-web.prod.json > /tmp/config.json
```

`apiBaseUrl` указывает на `https://<DOMAIN>/api/v1` — тот же origin, что и фронт
(reverse-proxy ставит API и фронт на один домен → httpOnly-cookie работают
без cross-site). Для поддоменов vendor./admin. apiBaseUrl всё равно ведёт на
**apex** `https://<DOMAIN>/api/v1` (cookie заданы с `Domain=.<DOMAIN>`).

## Как подменить файл при деплое

Варианты (выберите один):

1. **ECS bind/volume или сборка финального образа** — скопировать нужный
   `config.<app>.prod.json` поверх `assets/config.json` на этапе CI (после
   `sed`-подстановки домена), затем запушить образ.
2. **initContainer / entrypoint** — на старте контейнера `cp` файла из
   смонтированного ConfigMap/Secret в `assets/config.json`.
3. **CDN/S3** — если статика раздаётся из S3+CloudFront, залить `config.json`
   в бакет рядом со статикой.

Главное: НЕ редактируйте `apps/*/public/assets/config.json` (это dev-значения,
ими занимаются агенты приложения) — используйте файлы из этой папки.
