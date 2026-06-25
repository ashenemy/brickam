import type { Migration } from '../types';
import { initialIndexes } from './0001-initial-indexes';

/**
 * Реестр всех миграций, отсортированных по возрастанию id. Будущие миграции
 * добавляются отдельными файлами (`0002-...`, `0003-...`) и регистрируются здесь.
 */
export const MIGRATIONS: Migration[] = [initialIndexes].sort((a, b) => a.id.localeCompare(b.id));
