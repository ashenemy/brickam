# Деплой Brickam в AWS ECS (Fargate)

Шаблоны и шаги для запуска API-сервера Brickam в ECS за ALB.
Все идентификаторы — плейсхолдеры; впишите свои.

## Что где вписать (быстрый список)

| Плейсхолдер | Где | Что вписать |
|-------------|-----|-------------|
| `<ACCOUNT_ID>` | task-definition.server.json | ID AWS-аккаунта (12 цифр) |
| `<REGION>` | task-definition + workflow | регион (напр. `eu-central-1`) |
| `<ECR_REGISTRY>` | task-definition | `<ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com` |
| `<IMAGE_TAG>` | task-definition | тег образа (CI ставит `github.sha`) |
| `<DOMAIN>` | task-definition (CORS) + nginx + config | домен фронта |
| `secret:.../...-XXXXXX` | task-definition `secrets[]` | реальные ARN Secrets Manager |
| `brickam-cluster`, `brickam-server` (service) | workflow secrets/env | имя кластера/сервиса ECS |

## 0. Предпосылки (создаётся один раз, владельцем)

- **ECR-репозитории**: `brickam-server`, `brickam-main-web`, `brickam-vendor-web`, `brickam-admin-web`.
- **Secrets Manager**: секреты `brickam/prod/*` (jwt, twilio, arca, idram, sentry-dsn, s3, mongo-uri, redis-url).
- **IAM-роли**:
  - `brickam-ecs-execution-role` — `AmazonECSTaskExecutionRolePolicy` + inline-политика `secretsmanager:GetSecretValue` на ARN секретов.
  - `brickam-server-task-role` — доступ приложения к S3 и т.п.
  - `brickam-gha-deploy-role` — OIDC-роль для GitHub Actions (trust на `token.actions.githubusercontent.com`, политики `ecr:*`(push), `ecs:RegisterTaskDefinition/UpdateService/RunTask`, `iam:PassRole` на роли выше). Её ARN → секрет `AWS_ROLE_ARN`.
- **ALB + target group** на порт 3000 (см. п.3).
- **CloudWatch log group** `/ecs/brickam-server` (или `awslogs-create-group:true`, как в шаблоне).

## 1. Регистрация task definition

Шаблон `task-definition.server.json` содержит пояснительные ключи `_comment*`,
которые ECS НЕ принимает. Удалите их перед регистрацией:

```bash
jq 'walk(if type == "object"
         then with_entries(select(.key | startswith("_comment") | not))
         else . end)' \
  infra/ecs/task-definition.server.json > /tmp/td.server.json

# подставьте реальные значения (пример)
sed -i 's/<ACCOUNT_ID>/123456789012/g; s/<REGION>/eu-central-1/g; s#<ECR_REGISTRY>#123456789012.dkr.ecr.eu-central-1.amazonaws.com#g' /tmp/td.server.json

aws ecs register-task-definition --cli-input-json file:///tmp/td.server.json
```

> `walk` требует jq ≥ 1.6. Если нет — удалите `_comment*` вручную.
> В CI (`deploy-ecs.yml`) образ подставляется через `amazon-ecs-render-task-definition`,
> а `_comment*` нужно вычистить тем же `jq` до рендера (см. workflow).

## 2. Создание сервиса за ALB

```bash
aws ecs create-service \
  --cluster brickam-cluster \
  --service-name brickam-server \
  --task-definition brickam-server \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration 'awsvpcConfiguration={subnets=[subnet-AAA,subnet-BBB],securityGroups=[sg-XXX],assignPublicIp=DISABLED}' \
  --load-balancers 'targetGroupArn=arn:aws:elasticloadbalancing:<REGION>:<ACCOUNT_ID>:targetgroup/brickam-server/XXXX,containerName=server,containerPort=3000' \
  --health-check-grace-period-seconds 30
```

## 3. Health-check у target group ALB

Target group для сервиса должна проверять **readiness** (готовность принимать
трафик, пингует Mongo+Redis):

- **Health check path**: `/api/health/ready`
- **Port**: traffic-port (3000)
- **Success codes**: `200`
- Interval 15s, timeout 5s, healthy/unhealthy threshold 2–3.

Контейнерный health-check (в task definition) бьёт по `/api/health/live` —
liveness без зависимостей, чтобы под не перезапускался при кратковременной
недоступности Mongo/Redis. Разделение:
- `/api/health/live` → контейнерный healthCheck (жив ли процесс).
- `/api/health/ready` → ALB target group (можно ли слать трафик).

## 4. Прогон миграций (one-off task)

Миграции запускаются ОТДЕЛЬНОЙ задачей перед деплоем сервиса — тем же образом,
но с переопределением команды на `npm run migrate` (скрипт в package.json →
`nx run migrate:migrate`). В CI это делает шаг «migrate» в `deploy-ecs.yml`:

```bash
aws ecs run-task \
  --cluster brickam-cluster \
  --task-definition brickam-server \
  --launch-type FARGATE \
  --network-configuration 'awsvpcConfiguration={subnets=[subnet-AAA,subnet-BBB],securityGroups=[sg-XXX],assignPublicIp=DISABLED}' \
  --overrides '{"containerOverrides":[{"name":"server","command":["npm","run","migrate"]}]}' \
  --started-by "manual-migrate"
```

Дождитесь `STOPPED` со статусом `exitCode: 0` (CI делает `aws ecs wait
tasks-stopped` и проверяет код выхода).

## 5. Прочие сервисы (фронты)

`main-web` (SSR, порт 4000), `vendor-web`/`admin-web` (nginx, порт 80) —
по аналогии: свой ECR-образ, свой task definition (скопируйте этот шаблон,
поменяйте порт/health-путь), свой ALB/target group и server_name на nginx
reverse-proxy (`infra/nginx.reverse-proxy.conf`). Фронты-CSR можно также
раздавать из S3+CloudFront вместо ECS.
