import { ForbiddenException } from '@brickam/core-kit';
import { Role } from '@brickam/domain-kit';
import type { AuthUser } from '@brickam/server-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UpsertPageDto } from './dto/page.dto';
import type { PagesService } from './pages.service';
import { PagesAdminController } from './pages-admin.controller';

const admin: AuthUser = { id: 'admin1', role: Role.Admin };
const buyer: AuthUser = { id: 'b1', role: Role.Buyer };

const dto: UpsertPageDto = {
    title: { hy: 'h', ru: 'r', en: 'e' },
    content: { hy: 'h', ru: 'r', en: 'e' },
};

describe('PagesAdminController', () => {
    let service: {
        adminList: ReturnType<typeof vi.fn>;
        adminGet: ReturnType<typeof vi.fn>;
        upsert: ReturnType<typeof vi.fn>;
        remove: ReturnType<typeof vi.fn>;
    };
    let controller: PagesAdminController;

    beforeEach(() => {
        service = {
            adminList: vi.fn().mockResolvedValue([]),
            adminGet: vi.fn().mockResolvedValue({ slug: 'about' }),
            upsert: vi.fn().mockResolvedValue({ slug: 'about' }),
            remove: vi.fn().mockResolvedValue(undefined),
        };
        controller = new PagesAdminController(service as unknown as PagesService);
    });

    describe('adminList (только админ)', () => {
        it('админ получает список', async () => {
            await controller.adminList(admin);
            expect(service.adminList).toHaveBeenCalled();
        });

        it('не админ → Forbidden, сервис не вызывается', () => {
            expect(() => controller.adminList(buyer)).toThrow(ForbiddenException);
            expect(service.adminList).not.toHaveBeenCalled();
        });
    });

    describe('adminGet (только админ)', () => {
        it('не админ → Forbidden', () => {
            expect(() => controller.adminGet(buyer, 'about')).toThrow(ForbiddenException);
        });
    });

    describe('upsert (только админ)', () => {
        it('админ сохраняет, adminId = user.id', async () => {
            await controller.upsert(admin, 'about', dto);
            expect(service.upsert).toHaveBeenCalledWith('about', dto, 'admin1');
        });

        it('не админ → Forbidden, сервис не вызывается', () => {
            expect(() => controller.upsert(buyer, 'about', dto)).toThrow(ForbiddenException);
            expect(service.upsert).not.toHaveBeenCalled();
        });
    });

    describe('remove (только админ)', () => {
        it('админ удаляет, adminId = user.id', async () => {
            await controller.remove(admin, 'about');
            expect(service.remove).toHaveBeenCalledWith('about', 'admin1');
        });

        it('не админ → Forbidden, сервис не вызывается', () => {
            expect(() => controller.remove(buyer, 'about')).toThrow(ForbiddenException);
            expect(service.remove).not.toHaveBeenCalled();
        });
    });
});
