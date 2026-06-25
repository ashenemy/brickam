/** Вход для генерации presigned-URL загрузки. `key` — путь объекта в бакете. */
export type UploadUrlInput = {
    key: string;
    contentType: string;
};

/** Результат генерации presigned-URL загрузки. */
export type UploadUrlResult = {
    /** Presigned PUT-URL: фронт грузит файл напрямую сюда. */
    uploadUrl: string;
    /** Публичный URL объекта после успешной загрузки. */
    publicUrl: string;
    /** Путь объекта в бакете. */
    key: string;
};

/** Поля конфига S3, нужные провайдеру (всё опционально на уровне секретов). */
export type S3StorageConfig = {
    region?: string | undefined;
    endpoint?: string | undefined;
    bucket: string;
    accessKeyId?: string | undefined;
    secretAccessKey?: string | undefined;
    publicUrl?: string | undefined;
};
