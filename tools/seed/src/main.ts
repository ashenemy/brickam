import mongoose from 'mongoose';
import { DEFAULT_CLOCK } from './dataset';
import { MongoSeedStore } from './mongo-store';
import { formatReport, runSeed } from './run-seed';

/**
 * Точка входа сида. Читает MONGO_URI из env, коннектит mongoose, применяет
 * датасет через MongoSeedStore (идемпотентно), печатает отчёт и закрывает
 * соединение. Повторный запуск не плодит дублей.
 */
async function main(): Promise<void> {
    const uri = process.env['MONGO_URI'];
    if (uri === undefined || uri.length === 0) {
        // eslint-disable-next-line no-console
        console.error('MONGO_URI не задан. Пример: MONGO_URI=mongodb://localhost:27017/brickam');
        process.exitCode = 1;
        return;
    }

    await mongoose.connect(uri);
    try {
        // Время сидирования фиксируется один раз (детерминированный createdAt/
        // updatedAt в рамках прогона).
        const now = new Date();
        const store = new MongoSeedStore(mongoose.connection, now);
        const report = await runSeed(store, DEFAULT_CLOCK);
        // eslint-disable-next-line no-console
        console.log(formatReport(report));
    } finally {
        await mongoose.disconnect();
    }
}

main().catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', err);
    process.exitCode = 1;
});
