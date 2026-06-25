/**
 * Контракт серверной загрузки объектов в хранилище (S3). Реализует feature
 * `storage`; потребители (напр. ai-assistant — выгрузка отрендеренного видео)
 * зависят только от контракта, не импортируя feature напрямую (граница §16).
 */
export abstract class StorageServiceContract {
    /**
     * Кладёт объект в хранилище под ключом `key` и возвращает его публичный URL.
     * `body` — содержимое файла, `contentType` — MIME (напр. 'video/mp4').
     */
    abstract putObject(
        key: string,
        body: Uint8Array,
        contentType: string,
    ): Promise<{ url: string }>;
}
