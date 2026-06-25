import { ForbiddenException } from '@brickam/core-kit';
import { Role } from '@brickam/domain-kit';
import type { AuthUser } from '@brickam/server-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DisputesController } from './disputes.controller';
import type { DisputesService } from './disputes.service';

const admin: AuthUser = { id: 'admin1', role: Role.Admin };
const buyer: AuthUser = { id: 'b1', role: Role.Buyer };

describe('DisputesController', () => {
    let service: {
        open: ReturnType<typeof vi.fn>;
        list: ReturnType<typeof vi.fn>;
        get: ReturnType<typeof vi.fn>;
        review: ReturnType<typeof vi.fn>;
        resolve: ReturnType<typeof vi.fn>;
    };
    let controller: DisputesController;

    beforeEach(() => {
        service = {
            open: vi.fn().mockResolvedValue({ id: 'd1', status: 'open' }),
            list: vi.fn().mockResolvedValue([]),
            get: vi.fn().mockResolvedValue({ id: 'd1' }),
            review: vi.fn().mockResolvedValue({ id: 'd1', status: 'reviewing' }),
            resolve: vi.fn().mockResolvedValue({ id: 'd1', status: 'resolved' }),
        };
        controller = new DisputesController(service as unknown as DisputesService);
    });

    it('open: любой авторизованный, передаёт openedBy и dto', async () => {
        const dto = { orderId: 'o1', vendorId: 'v1', reason: 'Брак' };
        await controller.open('b1', dto);
        expect(service.open).toHaveBeenCalledWith('b1', dto);
    });

    describe('list (только админ)', () => {
        it('админ получает список со статусом', async () => {
            await controller.list(admin, 'open');
            expect(service.list).toHaveBeenCalledWith('open');
        });

        it('не админ → Forbidden, сервис не вызывается', () => {
            expect(() => controller.list(buyer, 'open')).toThrow(ForbiddenException);
            expect(service.list).not.toHaveBeenCalled();
        });
    });

    describe('get (только админ)', () => {
        it('не админ → Forbidden', () => {
            expect(() => controller.get(buyer, 'd1')).toThrow(ForbiddenException);
        });
    });

    describe('review (только админ)', () => {
        it('админ переводит в разбор, adminId = user.id', async () => {
            await controller.review(admin, 'd1');
            expect(service.review).toHaveBeenCalledWith('d1', 'admin1');
        });

        it('не админ → Forbidden', () => {
            expect(() => controller.review(buyer, 'd1')).toThrow(ForbiddenException);
            expect(service.review).not.toHaveBeenCalled();
        });
    });

    describe('resolve (только админ)', () => {
        it('админ закрывает с решением', async () => {
            await controller.resolve(admin, 'd1', { resolution: 'Возврат' });
            expect(service.resolve).toHaveBeenCalledWith('d1', 'admin1', 'Возврат');
        });

        it('не админ → Forbidden', () => {
            expect(() => controller.resolve(buyer, 'd1', { resolution: 'x' })).toThrow(
                ForbiddenException,
            );
            expect(service.resolve).not.toHaveBeenCalled();
        });
    });
});
