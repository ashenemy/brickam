import { AccountType, Permission, Role, UserStatus } from '@brickam/domain-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

/** Документ-подобный объект для маппинга toContract. */
const makeDoc = (over: Record<string, unknown> = {}) => ({
    id: 'u1',
    _id: { toString: () => 'u1' },
    role: Role.Buyer,
    accountType: AccountType.Individual,
    name: 'Արամ',
    phone: '+37499000000',
    phoneVerified: false,
    passwordHash: 'hash',
    lang: 'hy',
    status: UserStatus.Active,
    vendorId: undefined,
    permissions: [Permission.OrdersView],
    ...over,
});

describe('UsersService', () => {
    let repo: {
        findByPhone: ReturnType<typeof vi.fn>;
        findById: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
        updateById: ReturnType<typeof vi.fn>;
    };
    let service: UsersService;

    beforeEach(() => {
        repo = {
            findByPhone: vi.fn(),
            findById: vi.fn(),
            create: vi.fn(),
            updateById: vi.fn(),
        };
        service = new UsersService(repo as unknown as UsersRepository);
    });

    it('реализует контракт UsersServiceContract', () => {
        expect(typeof service.findByPhone).toBe('function');
        expect(typeof service.findById).toBe('function');
        expect(typeof service.createUser).toBe('function');
        expect(typeof service.markPhoneVerified).toBe('function');
        expect(typeof service.updatePassword).toBe('function');
    });

    it('toContract: id из документа, перенос полей и permissions', async () => {
        repo.findById.mockResolvedValue(makeDoc());
        const user = await service.findById('u1');
        expect(user).toEqual({
            id: 'u1',
            role: Role.Buyer,
            accountType: AccountType.Individual,
            name: 'Արամ',
            phone: '+37499000000',
            phoneVerified: false,
            passwordHash: 'hash',
            lang: 'hy',
            status: UserStatus.Active,
            permissions: [Permission.OrdersView],
        });
    });

    it('toContract: опускает undefined-поля (accountType/vendorId/permissions)', async () => {
        repo.findById.mockResolvedValue(
            makeDoc({ accountType: undefined, vendorId: undefined, permissions: undefined }),
        );
        const user = await service.findById('u1');
        expect(user).not.toHaveProperty('accountType');
        expect(user).not.toHaveProperty('vendorId');
        expect(user).not.toHaveProperty('permissions');
    });

    it('toContract: переносит vendorId, когда он задан', async () => {
        repo.findById.mockResolvedValue(makeDoc({ role: Role.VendorOwner, vendorId: 'v1' }));
        const user = await service.findById('u1');
        expect(user?.vendorId).toBe('v1');
    });

    it('toContract: id берётся из _id.toString() при отсутствии doc.id', async () => {
        repo.findById.mockResolvedValue(makeDoc({ id: undefined }));
        const user = await service.findById('u1');
        expect(user?.id).toBe('u1');
    });

    it('findById возвращает null, если документ не найден', async () => {
        repo.findById.mockResolvedValue(null);
        expect(await service.findById('missing')).toBeNull();
    });

    it('findByPhone делегирует репозиторию и маппит результат', async () => {
        repo.findByPhone.mockResolvedValue(makeDoc({ phone: '+37411111111' }));
        const user = await service.findByPhone('+37411111111');
        expect(repo.findByPhone).toHaveBeenCalledWith('+37411111111');
        expect(user?.phone).toBe('+37411111111');
    });

    it('findByPhone возвращает null, если не найдено', async () => {
        repo.findByPhone.mockResolvedValue(null);
        expect(await service.findByPhone('+37400000000')).toBeNull();
    });

    it('createUser делегирует create и возвращает контракт', async () => {
        const data = {
            role: Role.Buyer,
            name: 'Նոր',
            phone: '+37422222222',
            passwordHash: 'h2',
        };
        repo.create.mockResolvedValue(
            makeDoc({ name: 'Նոր', phone: '+37422222222', passwordHash: 'h2' }),
        );
        const user = await service.createUser(data);
        expect(repo.create).toHaveBeenCalledWith(data);
        expect(user.name).toBe('Նոր');
        expect(user.passwordHash).toBe('h2');
    });

    it('markPhoneVerified выставляет phoneVerified:true через репозиторий', async () => {
        repo.updateById.mockResolvedValue(makeDoc({ phoneVerified: true }));
        await service.markPhoneVerified('u1');
        expect(repo.updateById).toHaveBeenCalledWith('u1', { phoneVerified: true });
    });

    it('updatePassword обновляет хеш через репозиторий', async () => {
        repo.updateById.mockResolvedValue(makeDoc({ passwordHash: 'new-hash' }));
        await service.updatePassword('u1', 'new-hash');
        expect(repo.updateById).toHaveBeenCalledWith('u1', { passwordHash: 'new-hash' });
    });

    it('getLoyaltyMetric: читает users.loyalty (с currentTierId)', async () => {
        repo.findById.mockResolvedValue(
            makeDoc({ loyalty: { totalSpend: 12000, totalOrders: 3, currentTierId: '2' } }),
        );
        const metric = await service.getLoyaltyMetric('u1');
        expect(metric).toEqual({ totalSpend: 12000, totalOrders: 3, currentTierId: '2' });
    });

    it('getLoyaltyMetric: нули и без currentTierId, если loyalty отсутствует', async () => {
        repo.findById.mockResolvedValue(makeDoc({ loyalty: undefined }));
        const metric = await service.getLoyaltyMetric('u1');
        expect(metric).toEqual({ totalSpend: 0, totalOrders: 0 });
        expect(metric).not.toHaveProperty('currentTierId');
    });

    it('getLoyaltyMetric: нули, если пользователя нет', async () => {
        repo.findById.mockResolvedValue(null);
        expect(await service.getLoyaltyMetric('missing')).toEqual({
            totalSpend: 0,
            totalOrders: 0,
        });
    });

    it('updateLoyalty: пишет метрику с currentTierId', async () => {
        repo.updateById.mockResolvedValue(makeDoc());
        await service.updateLoyalty('u1', { totalSpend: 5000, totalOrders: 2, currentTierId: '2' });
        expect(repo.updateById).toHaveBeenCalledWith('u1', {
            loyalty: { totalSpend: 5000, totalOrders: 2, currentTierId: '2' },
        });
    });

    it('updateLoyalty: опускает currentTierId, когда его нет', async () => {
        repo.updateById.mockResolvedValue(makeDoc());
        await service.updateLoyalty('u1', { totalSpend: 100, totalOrders: 1 });
        expect(repo.updateById).toHaveBeenCalledWith('u1', {
            loyalty: { totalSpend: 100, totalOrders: 1 },
        });
    });
});
