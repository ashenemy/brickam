import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TemplatesController } from './templates.controller';
import type { TemplatesService } from './templates.service';

describe('TemplatesController', () => {
    let service: {
        findAll: ReturnType<typeof vi.fn>;
        findByKey: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
        updateByKey: ReturnType<typeof vi.fn>;
        removeByKey: ReturnType<typeof vi.fn>;
    };
    let controller: TemplatesController;

    beforeEach(() => {
        service = {
            findAll: vi.fn(),
            findByKey: vi.fn(),
            create: vi.fn(),
            updateByKey: vi.fn(),
            removeByKey: vi.fn(),
        };
        controller = new TemplatesController(service as unknown as TemplatesService);
    });

    it('findAll делегирует сервису с query', async () => {
        const page = { data: [], meta: {} };
        service.findAll.mockResolvedValue(page);
        const query = { page: 1, pageSize: 20 };
        expect(await controller.findAll(query as never)).toBe(page);
        expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('findByKey делегирует сервису', async () => {
        const tpl = { key: 'auth.otp' };
        service.findByKey.mockResolvedValue(tpl);
        expect(await controller.findByKey('auth.otp')).toBe(tpl);
        expect(service.findByKey).toHaveBeenCalledWith('auth.otp');
    });

    it('create делегирует сервису', async () => {
        const dto = { key: 'x' };
        const created = { key: 'x' };
        service.create.mockResolvedValue(created);
        expect(await controller.create(dto as never)).toBe(created);
        expect(service.create).toHaveBeenCalledWith(dto);
    });

    it('update делегирует сервису', async () => {
        const dto = { name: 'New' };
        const updated = { key: 'x', name: 'New' };
        service.updateByKey.mockResolvedValue(updated);
        expect(await controller.update('x', dto as never)).toBe(updated);
        expect(service.updateByKey).toHaveBeenCalledWith('x', dto);
    });

    it('remove возвращает ключ и вызывает сервис', async () => {
        service.removeByKey.mockResolvedValue(undefined);
        expect(await controller.remove('x')).toEqual({ key: 'x' });
        expect(service.removeByKey).toHaveBeenCalledWith('x');
    });
});
