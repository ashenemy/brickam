# @brickam/storage

Абстракция хранилища медиа и эндпоинт получения presigned-URL для прямой загрузки
файлов в S3-совместимое хранилище.

- `StorageProvider` — абстракция: `getUploadUrl({ key, contentType })`.
- `S3StorageProvider` — реальный провайдер (AWS SDK v3, presigned PUT).
- `NoopStorageProvider` — dev-заглушка без S3-ключей.
- `StorageModule` — `@Global`, выбирает провайдер по наличию `secrets.s3Bucket`.
- `MediaController` — `POST /media/upload-url` (`@Auth(Permission.ProductsManage)`).
