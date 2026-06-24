import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PaginationQueryDto } from '../dto/pagination-query.dto';
import { BaseCrudController } from './base-crud.controller';

type Entity = { _id: string };

class Controller extends BaseCrudController<Entity, { a: string }, { a?: string }> {
    // biome-ignore lint/complexity/noUselessConstructor: открываем protected-конструктор базы
    constructor(service: any) {
        super(service);
    }
}

describe('BaseCrudController', () => {
    let service: any;
    let controller: Controller;

    beforeEach(() => {
        service = {
            findAll: vi.fn(() => Promise.resolve({ data: [], meta: {} })),
            findOne: vi.fn((id: string) => Promise.resolve({ _id: id })),
            create: vi.fn((dto: any) => Promise.resolve({ _id: 'new', ...dto })),
            update: vi.fn((id: string, dto: any) => Promise.resolve({ _id: id, ...dto })),
            remove: vi.fn(() => Promise.resolve()),
        };
        controller = new Controller(service);
    });

    it('делегирует CRUD сервису', async () => {
        const q = { page: 1, pageSize: 20 } as PaginationQueryDto;
        await controller.findAll(q);
        expect(service.findAll).toHaveBeenCalledWith(q);

        await controller.findOne('1');
        expect(service.findOne).toHaveBeenCalledWith('1');

        await controller.create({ a: 'x' });
        expect(service.create).toHaveBeenCalledWith({ a: 'x' });

        await controller.update('1', { a: 'y' });
        expect(service.update).toHaveBeenCalledWith('1', { a: 'y' });

        expect(await controller.remove('1')).toEqual({ id: '1' });
        expect(service.remove).toHaveBeenCalledWith('1');
    });
});
