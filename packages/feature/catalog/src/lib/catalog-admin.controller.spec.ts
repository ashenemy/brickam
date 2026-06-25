import { ForbiddenException } from '@brickam/core-kit';
import { type AuditServiceContract, Role } from '@brickam/domain-kit';
import type { AuthUser } from '@brickam/server-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogAdminController } from './catalog-admin.controller';
import type { CatalogAiService } from './catalog-ai.service';
import type { ProductsService } from './products.service';

const admin: AuthUser = { id: 'a1', role: Role.Admin };
const buyer: AuthUser = { id: 'u1', role: Role.Buyer };

describe('CatalogAdminController', () => {
    let platformSettings: {
        getSetting: ReturnType<typeof vi.fn>;
        saveSetting: ReturnType<typeof vi.fn>;
    };
    let productsService: { setStatus: ReturnType<typeof vi.fn> };
    let audit: { record: ReturnType<typeof vi.fn> };
    let controller: CatalogAdminController;

    beforeEach(() => {
        platformSettings = {
            getSetting: vi.fn().mockResolvedValue({ commissionPercent: 5 }),
            saveSetting: vi.fn().mockResolvedValue(undefined),
        };
        productsService = { setStatus: vi.fn().mockResolvedValue(undefined) };
        audit = { record: vi.fn().mockResolvedValue(undefined) };
        controller = new CatalogAdminController(
            platformSettings as unknown as CatalogAiService,
            productsService as unknown as ProductsService,
            audit as unknown as AuditServiceContract,
        );
    });

    describe('admin-гейт', () => {
        it('не админ → Forbidden (getSetting)', async () => {
            await expect(controller.getSetting(buyer, 'default')).rejects.toBeInstanceOf(
                ForbiddenException,
            );
        });

        it('без пользователя → Forbidden (saveSetting)', async () => {
            await expect(
                controller.saveSetting(undefined, 'default', { value: {} }),
            ).rejects.toBeInstanceOf(ForbiddenException);
        });

        it('не админ → Forbidden (moderateProduct)', async () => {
            await expect(
                controller.moderateProduct(buyer, 'p1', { action: 'approve' }),
            ).rejects.toBeInstanceOf(ForbiddenException);
        });
    });

    describe('settings', () => {
        it('getSetting делегирует сервису', async () => {
            const result = await controller.getSetting(admin, 'default');
            expect(platformSettings.getSetting).toHaveBeenCalledWith('default');
            expect(result).toEqual({ commissionPercent: 5 });
        });

        it('saveSetting сохраняет + пишет аудит', async () => {
            await controller.saveSetting(admin, 'media', { value: { maxVideo: 3 } });
            expect(platformSettings.saveSetting).toHaveBeenCalledWith('media', { maxVideo: 3 });
            expect(audit.record).toHaveBeenCalledWith({
                actorId: 'a1',
                action: 'settings.save',
                targetType: 'setting',
                targetId: 'media',
            });
        });
    });

    describe('moderateProduct', () => {
        it('approve → status active + аудит', async () => {
            await controller.moderateProduct(admin, 'p1', { action: 'approve' });
            expect(productsService.setStatus).toHaveBeenCalledWith('p1', 'active');
            expect(audit.record).toHaveBeenCalledWith({
                actorId: 'a1',
                action: 'product.moderate',
                targetType: 'product',
                targetId: 'p1',
                meta: { action: 'approve' },
            });
        });

        it('reject → status hidden', async () => {
            await controller.moderateProduct(admin, 'p2', { action: 'reject' });
            expect(productsService.setStatus).toHaveBeenCalledWith('p2', 'hidden');
            expect(audit.record).toHaveBeenCalledWith(
                expect.objectContaining({ meta: { action: 'reject' } }),
            );
        });
    });
});
