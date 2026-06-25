import { ForbiddenException } from '@brickam/core-kit';
import { Role } from '@brickam/domain-kit';
import type { AuthUser } from '@brickam/server-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditController } from './audit.controller';
import type { AuditService } from './audit.service';

const admin: AuthUser = { id: 'admin1', role: Role.Admin };
const buyer: AuthUser = { id: 'b1', role: Role.Buyer };

describe('AuditController', () => {
    let service: { list: ReturnType<typeof vi.fn> };
    let controller: AuditController;

    beforeEach(() => {
        service = { list: vi.fn().mockResolvedValue([{ id: 'a1' }]) };
        controller = new AuditController(service as unknown as AuditService);
    });

    it('админ получает список с парсингом limit', async () => {
        await controller.list(admin, '10');
        expect(service.list).toHaveBeenCalledWith(10);
    });

    it('без limit использует дефолт 50', async () => {
        await controller.list(admin);
        expect(service.list).toHaveBeenCalledWith(50);
    });

    it('некорректный limit заменяется дефолтом', async () => {
        await controller.list(admin, 'abc');
        expect(service.list).toHaveBeenCalledWith(50);
    });

    it('не админ → ForbiddenException, сервис не вызывается', () => {
        expect(() => controller.list(buyer, '10')).toThrow(ForbiddenException);
        expect(service.list).not.toHaveBeenCalled();
    });
});
