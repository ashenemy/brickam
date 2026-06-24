import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { PERMISSIONS_KEY } from '../../@types';

/**
 * Помечает маршрут как требующий аутентификации и (опц.) набора прав.
 * Сами guard'ы (JWT + PermissionsGuard) подключаются в Stage 2 (auth-kit);
 * метаданные прав уже проставляются здесь.
 */
export const Auth = (...permissions: string[]) =>
    applyDecorators(
        SetMetadata(PERMISSIONS_KEY, permissions),
        ApiBearerAuth(),
        ApiUnauthorizedResponse({ description: 'Требуется аутентификация' }),
    );
