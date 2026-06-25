import mongoose from 'mongoose';
import { MongoMigrationDb } from './mongo-db';
import { formatReport, runMigrations } from './run-migrations';

/**
 * Точка входа миграций. Читает MONGO_URI из env, коннектит mongoose, применяет
 * непримененные миграции через MongoMigrationDb (идемпотентно — журнал в
 * коллекции `migrations`), печатает отчёт и закрывает соединение.
 */
async function main(): Promise<void> {
    const uri = process.env['MONGO_URI'];
    if (uri === undefined || uri.length === 0) {
        // eslint-disable-next-line no-console
        console.error('MONGO_URI не задан. Пример: MONGO_URI=mongodb://localhost:27017/buildhub');
        process.exitCode = 1;
        return;
    }

    await mongoose.connect(uri);
    try {
        const db = new MongoMigrationDb(mongoose.connection, new Date());
        const report = await runMigrations(db);
        // eslint-disable-next-line no-console
        console.log(formatReport(report));
    } finally {
        await mongoose.disconnect();
    }
}

main().catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Migrate failed:', err);
    process.exitCode = 1;
});
