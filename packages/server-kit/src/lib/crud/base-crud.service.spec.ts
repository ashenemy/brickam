import { AppException } from '@brickam/core-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseCrudService } from './base-crud.service';

type Entity = { _id: string; name: string };

class Repo {
    create = vi.fn((d: any) => Promise.resolve({ _id: '1', ...d }));
    findById = vi.fn((id: string) => Promise.resolve(id === '1' ? { _id: '1', name: 'a' } : null));
    findPaginated = vi.fn(() =>
        Promise.resolve({
            data: [{ _id: '1', name: 'a' }],
            meta: { page: 1, pageSize: 5, total: 1 },
        }),
    );
    updateById = vi.fn((id: string, u: any) =>
        Promise.resolve(id === '1' ? { _id: '1', ...u } : null),
    );
    deleteById = vi.fn((id: string) => Promise.resolve(id === '1'));
}

class Service extends BaseCrudService<Entity, { name: string }, { name?: string }> {
    constructor(repo: any) {
        super(repo, 5);
    }
}

describe('BaseCrudService', () => {
    let repo: Repo;
    let service: Service;

    beforeEach(() => {
        repo = new Repo();
        service = new Service(repo);
    });

    it('create вызывает beforeCreate→repo.create→afterChange', async () => {
        const spy = vi.spyOn(service as any, 'afterChange');
        const created = await service.create({ name: 'x' });
        expect(repo.create).toHaveBeenCalledWith({ name: 'x' });
        expect(created).toMatchObject({ name: 'x' });
        expect(spy).toHaveBeenCalled();
    });

    it('findAll ограничивает pageSize по maxPageSize', async () => {
        await service.findAll({ page: 1, pageSize: 999 });
        expect(repo.findPaginated).toHaveBeenCalledWith({}, { page: 1, pageSize: 5 });
    });

    it('findOne бросает NotFound при отсутствии', async () => {
        await expect(service.findOne('404')).rejects.toBeInstanceOf(AppException);
        expect(await service.findOne('1')).toMatchObject({ name: 'a' });
    });

    it('update бросает NotFound, иначе возвращает обновлённое', async () => {
        await expect(service.update('404', { name: 'z' })).rejects.toBeInstanceOf(AppException);
        expect(await service.update('1', { name: 'z' })).toMatchObject({ name: 'z' });
    });

    it('remove бросает NotFound если не удалено', async () => {
        await expect(service.remove('404')).rejects.toBeInstanceOf(AppException);
        await expect(service.remove('1')).resolves.toBeUndefined();
    });
});
