import type { AuthUser } from '@brickam/server-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatController } from './chat.controller';
import type { ChatService } from './chat.service';

const buyer: AuthUser = { id: 'b1', role: 'buyer' };
const vendor: AuthUser = { id: 'u-v', role: 'vendor', vendorId: 'v1' };

describe('ChatController', () => {
    let service: {
        listChats: ReturnType<typeof vi.fn>;
        getOrCreate: ReturnType<typeof vi.fn>;
        getMessages: ReturnType<typeof vi.fn>;
        markRead: ReturnType<typeof vi.fn>;
    };
    let controller: ChatController;

    beforeEach(() => {
        service = {
            listChats: vi.fn().mockResolvedValue([]),
            getOrCreate: vi.fn().mockResolvedValue({ id: 'c1' }),
            getMessages: vi.fn().mockResolvedValue({ data: [], meta: {} }),
            markRead: vi.fn().mockResolvedValue(undefined),
        };
        controller = new ChatController(service as unknown as ChatService);
    });

    it('listChats маппит AuthUser вендора в payload с vendorId', async () => {
        await controller.listChats(vendor);
        expect(service.listChats).toHaveBeenCalledWith(
            expect.objectContaining({ sub: 'u-v', role: 'vendor', vendorId: 'v1' }),
        );
    });

    it('getOrCreate передаёт buyerId и vendorId из dto', async () => {
        await controller.getOrCreate('b1', { vendorId: 'v1' });
        expect(service.getOrCreate).toHaveBeenCalledWith('b1', 'v1');
    });

    it('getMessages передаёт chatId, payload и query', async () => {
        const query = { page: 1, pageSize: 20 };
        await controller.getMessages(buyer, 'c1', query);
        expect(service.getMessages).toHaveBeenCalledWith(
            'c1',
            expect.objectContaining({ sub: 'b1', role: 'buyer' }),
            query,
        );
    });

    it('markRead передаёт chatId и payload', async () => {
        await controller.markRead(buyer, 'c1');
        expect(service.markRead).toHaveBeenCalledWith('c1', expect.objectContaining({ sub: 'b1' }));
    });
});
