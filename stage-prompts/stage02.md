# ▶ STAGE 2 — Auth и пользователи
Выполни ТОЛЬКО Stage 2. Foundations §13, §14.

**Цель:** регистрация/вход по телефону+паролю+OTP, роли.

**Сделай:** `packages/feature/auth` + `feature/users`.
- Эндпоинты: `POST /auth/register` (+374, пароль, роль)→OTP; `POST /auth/verify-otp`; `POST /auth/login`; `POST /auth/refresh`; `POST /auth/forgot`; `POST /auth/reset`.
- Сервисы (классы): `OtpService` (длина/TTL/попытки/кулдаун из конфига, хеш кода, rate-limit), `TokenService` (JWT access+refresh), `AuthService`, `UsersService` (на `BaseCrudService`).
- Вендор после регистрации — `status: pending`. Вход с нового устройства — доп. OTP (флаг).
- Guards: `JwtAuthGuard`, `PermissionsGuard` (права из Foundations §14, без `tenders.respond`).
- Тексты OTP-SMS — заглушка-провайдер (mock пишет код в лог); реальный текст подключится в Stage 3 через templates.
- `passwordHash` помечен `@Exclude()` (ClassSerializer не отдаёт).

**Тесты:** юнит OTP (генерация/TTL/попытки/кулдаун/хеш/rate-limit); e2e register→verify→login→refresh; негативы (неверный/просроченный OTP, лимит); проверка ролевых guard'ов и `@Auth(...perms)`.

**✓ Чек-лист:**
- [ ] полный цикл auth на моке SMS работает
- [ ] access/refresh корректны; refresh ротация безопасна
- [ ] OTP-лимиты и хеширование соблюдаются; пароль не утекает в ответах
- [ ] роли/права гейтят доступ
- [ ] тесты/покрытие ок

