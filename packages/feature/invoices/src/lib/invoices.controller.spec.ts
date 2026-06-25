import { ValidationException } from '@brickam/core-kit';
import type { Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateInvoiceDto } from './dto/invoice.dto';
import { InvoicesController } from './invoices.controller';
import type { InvoicesService } from './invoices.service';

const makeDto = (): CreateInvoiceDto => ({
    chatId: 'c1',
    buyerId: 'b1',
    lineItems: [{ title: 'A', qty: 1, price: 100 }],
    validUntil: '2026-12-31T00:00:00Z',
});

describe('InvoicesController', () => {
    let service: {
        create: ReturnType<typeof vi.fn>;
        send: ReturnType<typeof vi.fn>;
        pay: ReturnType<typeof vi.fn>;
        cancel: ReturnType<typeof vi.fn>;
        getById: ReturnType<typeof vi.fn>;
        getByChat: ReturnType<typeof vi.fn>;
        pdf: ReturnType<typeof vi.fn>;
    };
    let controller: InvoicesController;

    beforeEach(() => {
        service = {
            create: vi.fn().mockResolvedValue({ id: 'inv1' }),
            send: vi.fn().mockResolvedValue({ id: 'inv1', status: 'sent' }),
            pay: vi
                .fn()
                .mockResolvedValue({ invoice: { id: 'inv1' }, orderId: 'o1', paymentId: 'p1' }),
            cancel: vi.fn().mockResolvedValue({ id: 'inv1', status: 'cancelled' }),
            getById: vi.fn().mockResolvedValue({ id: 'inv1' }),
            getByChat: vi.fn().mockResolvedValue([{ id: 'inv1' }]),
            pdf: vi.fn().mockResolvedValue(Buffer.from('%PDF-1.3')),
        };
        controller = new InvoicesController(service as unknown as InvoicesService);
    });

    it('create передаёт vendorId из контекста и dto', async () => {
        const dto = makeDto();
        await controller.create({ id: 'v1' }, dto);
        expect(service.create).toHaveBeenCalledWith('v1', dto);
    });

    it('create без vendor → ValidationException', () => {
        expect(() => controller.create(undefined, makeDto())).toThrow(ValidationException);
    });

    it('send передаёт id и vendorId', async () => {
        await controller.send('inv1', { id: 'v1' });
        expect(service.send).toHaveBeenCalledWith('inv1', 'v1');
    });

    it('send без vendor → ValidationException', () => {
        expect(() => controller.send('inv1', undefined)).toThrow(ValidationException);
    });

    it('pay передаёт id и buyerId', async () => {
        await controller.pay('inv1', 'b1');
        expect(service.pay).toHaveBeenCalledWith('inv1', 'b1');
    });

    it('cancel передаёт id и vendorId', async () => {
        await controller.cancel('inv1', { id: 'v1' });
        expect(service.cancel).toHaveBeenCalledWith('inv1', 'v1');
    });

    it('cancel без vendor → ValidationException', () => {
        expect(() => controller.cancel('inv1', undefined)).toThrow(ValidationException);
    });

    it('getById делегирует сервису', async () => {
        await controller.getById('inv1');
        expect(service.getById).toHaveBeenCalledWith('inv1');
    });

    it('getByChat делегирует сервису', async () => {
        await controller.getByChat('c1');
        expect(service.getByChat).toHaveBeenCalledWith('c1');
    });

    it('pdf проставляет заголовки и отдаёт Buffer', async () => {
        const res = {
            setHeader: vi.fn(),
            end: vi.fn(),
        } as unknown as Response;
        await controller.pdf('inv1', res);
        expect(service.pdf).toHaveBeenCalledWith('inv1');
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
        expect(res.end).toHaveBeenCalled();
    });
});
