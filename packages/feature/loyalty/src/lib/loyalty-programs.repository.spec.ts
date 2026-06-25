import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoyaltyProgramsRepository } from './loyalty-programs.repository';

const chain = (result: unknown) => {
    const query: any = {};
    query.exec = vi.fn(() => Promise.resolve(result));
    return query;
};

describe('LoyaltyProgramsRepository', () => {
    let model: any;
    let repo: LoyaltyProgramsRepository;

    beforeEach(() => {
        model = { findOne: vi.fn(() => chain({ active: true })) };
        repo = new LoyaltyProgramsRepository(model);
    });

    it('findActive ищет программу с active=true', async () => {
        const doc = await repo.findActive();
        expect(model.findOne).toHaveBeenCalledWith({ active: true });
        expect(doc).toMatchObject({ active: true });
    });
});
