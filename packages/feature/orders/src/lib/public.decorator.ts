import { SetMetadata } from '@nestjs/common';

/**
 * Ключ метаданных публичного маршрута. Совпадает с IS_PUBLIC_KEY из auth
 * (глобальный JwtAuthGuard читает именно его), поэтому помеченные маршруты
 * пропускаются без аутентификации. Локальная копия, чтобы не зависеть от
 * другого feature (граница feature → только kit/domain).
 */
export const IS_PUBLIC_KEY = 'isPublic';

/** Помечает маршрут как публичный (без аутентификации). */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
