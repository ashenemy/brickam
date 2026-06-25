import { ForbiddenException, NotFoundException } from '@brickam/core-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VendorsRepository } from './vendors.repository';
import { VendorsService } from './vendors.service';

const makeDoc = (over: Record<string, unknown> = {}) => ({
    id: 'v1',
    _id: { toString: () => 'v1' },
    slug: 'acme',
    name: 'Acme',
    display: 'Acme Store',
    ownerUserId: 'u1',
    region: 'Yerevan',
    city: 'Yerevan',
    status: 'active',
    ratingAvg: 0,
    ratingCount: 0,
    logo: undefined,
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-06-01'),
    ...over,
});

describe('VendorsService', () => {
    let repo: {
        findById: ReturnType<typeof vi.fn>;
        findBySlug: ReturnType<typeof vi.fn>;
        findByOwner: ReturnType<typeof vi.fn>;
        findAll: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
        updateById: ReturnType<typeof vi.fn>;
    };
    let service: VendorsService;

    beforeEach(() => {
        repo = {
            findById: vi.fn(),
            findBySlug: vi.fn(),
            findByOwner: vi.fn(),
            findAll: vi.fn(),
            create: vi.fn(),
            updateById: vi.fn(),
        };
        service = new VendorsService(repo as unknown as VendorsRepository);
    });

    describe('getById / getBySlug', () => {
        it('getById возвращает контракт и опускает undefined-поля', async () => {
            repo.findById.mockResolvedValue(makeDoc({ logo: undefined }));
            const vendor = await service.getById('v1');
            expect(vendor.id).toBe('v1');
            expect(vendor.slug).toBe('acme');
            expect(vendor).not.toHaveProperty('logo');
        });

        it('getById бросает NotFound, если вендора нет', async () => {
            repo.findById.mockResolvedValue(null);
            await expect(service.getById('vX')).rejects.toBeInstanceOf(NotFoundException);
        });

        it('getBySlug делегирует findBySlug', async () => {
            repo.findBySlug.mockResolvedValue(makeDoc());
            const vendor = await service.getBySlug('acme');
            expect(repo.findBySlug).toHaveBeenCalledWith('acme');
            expect(vendor.id).toBe('v1');
        });

        it('getBySlug бросает NotFound, если slug не найден', async () => {
            repo.findBySlug.mockResolvedValue(null);
            await expect(service.getBySlug('missing')).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('getMine', () => {
        it('возвращает профиль своего вендора по vendorId', async () => {
            repo.findById.mockResolvedValue(makeDoc());
            const vendor = await service.getMine('v1');
            expect(repo.findById).toHaveBeenCalledWith('v1');
            expect(vendor.id).toBe('v1');
        });
    });

    describe('updateProfile', () => {
        it('обновляет разрешённые поля своего вендора', async () => {
            repo.updateById.mockResolvedValue(makeDoc({ name: 'New', city: 'Gyumri' }));
            const vendor = await service.updateProfile('v1', { name: 'New', city: 'Gyumri' });
            expect(repo.updateById).toHaveBeenCalledWith('v1', { name: 'New', city: 'Gyumri' });
            expect(vendor.name).toBe('New');
            expect(vendor.city).toBe('Gyumri');
        });

        it('бросает NotFound, если вендора для обновления нет (чужой/несуществующий)', async () => {
            repo.updateById.mockResolvedValue(null);
            await expect(service.updateProfile('vX', { name: 'X' })).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });
    });

    describe('create', () => {
        it('создаёт вендора с ownerUserId, если slug свободен', async () => {
            repo.findBySlug.mockResolvedValue(null);
            repo.create.mockResolvedValue(makeDoc());
            const vendor = await service.create('u1', {
                slug: 'acme',
                name: 'Acme',
                region: 'Yerevan',
            });
            expect(repo.create).toHaveBeenCalledWith(
                expect.objectContaining({ slug: 'acme', ownerUserId: 'u1' }),
            );
            expect(vendor.ownerUserId).toBe('u1');
        });

        it('бросает Forbidden, если slug занят', async () => {
            repo.findBySlug.mockResolvedValue(makeDoc());
            await expect(
                service.create('u1', { slug: 'acme', name: 'Acme', region: 'Yerevan' }),
            ).rejects.toBeInstanceOf(ForbiddenException);
        });
    });

    describe('list', () => {
        it('без статуса → все вендоры', async () => {
            repo.findAll.mockResolvedValue([makeDoc(), makeDoc({ id: 'v2' })]);
            const result = await service.list();
            expect(repo.findAll).toHaveBeenCalledWith(undefined);
            expect(result).toHaveLength(2);
        });

        it('со статусом → фильтр по статусу', async () => {
            repo.findAll.mockResolvedValue([makeDoc({ status: 'suspended' })]);
            const result = await service.list('suspended');
            expect(repo.findAll).toHaveBeenCalledWith('suspended');
            expect(result[0]?.status).toBe('suspended');
        });
    });

    describe('setStatus', () => {
        it('approve → active', async () => {
            repo.updateById.mockResolvedValue(makeDoc({ status: 'active' }));
            const result = await service.setStatus('v1', 'active');
            expect(repo.updateById).toHaveBeenCalledWith('v1', { status: 'active' });
            expect(result.status).toBe('active');
        });

        it('reject → suspended', async () => {
            repo.updateById.mockResolvedValue(makeDoc({ status: 'suspended' }));
            const result = await service.setStatus('v1', 'suspended');
            expect(repo.updateById).toHaveBeenCalledWith('v1', { status: 'suspended' });
            expect(result.status).toBe('suspended');
        });

        it('нет вендора → NotFound', async () => {
            repo.updateById.mockResolvedValue(null);
            await expect(service.setStatus('vX', 'active')).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });
    });

    describe('recomputeRating', () => {
        it('пишет агрегат рейтинга в документ вендора', async () => {
            repo.updateById.mockResolvedValue(makeDoc({ ratingAvg: 4.5, ratingCount: 2 }));
            await service.recomputeRating('v1', 4.5, 2);
            expect(repo.updateById).toHaveBeenCalledWith('v1', { ratingAvg: 4.5, ratingCount: 2 });
        });
    });

    describe('createForOwner (VendorsServiceContract)', () => {
        it('создаёт вендора pending и возвращает vendorId', async () => {
            repo.findByOwner.mockResolvedValue(null);
            repo.create.mockResolvedValue(makeDoc({ id: 'v9', status: 'pending' }));
            const res = await service.createForOwner('u9');
            expect(res).toEqual({ vendorId: 'v9' });
            const arg = repo.create.mock.calls[0]?.[0] as Record<string, unknown>;
            expect(arg['ownerUserId']).toBe('u9');
            expect(arg['status']).toBe('pending');
        });

        it('идемпотентно: у владельца уже есть вендор → возвращает его', async () => {
            repo.findByOwner.mockResolvedValue(makeDoc({ id: 'v1' }));
            const res = await service.createForOwner('u1');
            expect(res).toEqual({ vendorId: 'v1' });
            expect(repo.create).not.toHaveBeenCalled();
        });
    });

    describe('setRating (VendorsServiceContract)', () => {
        it('денормализует рейтинг в документ вендора', async () => {
            repo.updateById.mockResolvedValue(makeDoc());
            await service.setRating('v1', 4.2, 7);
            expect(repo.updateById).toHaveBeenCalledWith('v1', { ratingAvg: 4.2, ratingCount: 7 });
        });
    });
});
