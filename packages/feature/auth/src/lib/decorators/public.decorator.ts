import { SetMetadata } from '@nestjs/common';

/** Ключ метаданных для публичных (не требующих аутентификации) маршрутов. */
export const IS_PUBLIC_KEY = 'isPublic';

/** Помечает маршрут/контроллер как публичный — guard'ы его пропускают. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
