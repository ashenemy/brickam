import { SetMetadata } from '@nestjs/common';

/**
 * Канонический источник `@Public` для всего монорепо (Foundations §17).
 * Фичи ре-экспортируют его из своих `public.decorator.ts`, чтобы не дублировать
 * логику и гарантировать единый ключ метаданных, который читают auth-guard'ы.
 */

/** Ключ метаданных для публичных (не требующих аутентификации) маршрутов. */
export const IS_PUBLIC_KEY = 'isPublic';

/** Помечает маршрут/контроллер как публичный — guard'ы его пропускают. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
