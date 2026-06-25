import { ForbiddenException } from '@brickam/core-kit';
import type { AuditServiceContract } from '@brickam/domain-kit';
import { Role } from '@brickam/domain-kit';
import type { AuthUser } from '@brickam/server-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TemplatesService } from './templates.service';
import { TemplatesAdminController } from './templates-admin.controller';

const admin: AuthUser = { id: 'a1', role: Role.Admin };
const buyer: AuthUser = { id: 'b1', role: Role.Buyer };

describe('TemplatesAdminController', () => {
    let service: {
        list: ReturnType<typeof vi.fn>;
        findByKey: ReturnType<typeof vi.fn>;
        upsert: ReturnType<typeof vi.fn>;
        previewRender: ReturnType<typeof vi.fn>;
    };
    let audit: { record: ReturnType<typeof vi.fn> };
    let controller: TemplatesAdminController;

    beforeEach(() => {
        service = {
            list: vi.fn(),
            findByKey: vi.fn(),
            upsert: vi.fn(),
            previewRender: vi.fn(),
        };
        audit = { record: vi.fn().mockResolvedValue(undefined) };
        controller = new TemplatesAdminController(
            service as unknown as TemplatesService,
            audit as unknown as AuditServiceContract,
        );
    });

    it('list делегирует сервису', async () => {
        const items = [{ key: 'auth.otp' }];
        service.list.mockResolvedValue(items);
        expect(await controller.list(admin)).toBe(items);
    });

    it('getByKey делегирует сервису', async () => {
        const tpl = { key: 'auth.otp' };
        service.findByKey.mockResolvedValue(tpl);
        expect(await controller.getByKey(admin, 'auth.otp')).toBe(tpl);
        expect(service.findByKey).toHaveBeenCalledWith('auth.otp');
    });

    it('upsert сохраняет и пишет аудит template.save', async () => {
        const dto = { content: { hy: '', ru: '{{name}}', en: '' }, variables: ['name'] };
        const saved = { key: 'x' };
        service.upsert.mockResolvedValue(saved);
        const result = await controller.upsert(admin, 'x', dto as never);
        expect(result).toBe(saved);
        expect(service.upsert).toHaveBeenCalledWith('x', dto);
        expect(audit.record).toHaveBeenCalledWith({
            actorId: 'a1',
            action: 'template.save',
            targetType: 'template',
            targetId: 'x',
        });
    });

    it('preview делегирует previewRender с lang и vars', async () => {
        const rendered = { body: 'Привет Вася' };
        service.previewRender.mockResolvedValue(rendered);
        const result = await controller.preview(admin, 'greet', {
            lang: 'ru',
            vars: { name: 'Вася' },
        } as never);
        expect(result).toBe(rendered);
        expect(service.previewRender).toHaveBeenCalledWith('greet', 'ru', { name: 'Вася' });
    });

    it('не админ → Forbidden errors.admin.notAdmin', async () => {
        // list/getByKey синхронно бросают в requireAdmin до возврата Promise.
        expect(() => controller.list(buyer)).toThrow(ForbiddenException);
        await expect(controller.upsert(buyer, 'x', {} as never)).rejects.toMatchObject({
            messageKey: 'errors.admin.notAdmin',
        });
        expect(service.list).not.toHaveBeenCalled();
        expect(service.upsert).not.toHaveBeenCalled();
    });
});
