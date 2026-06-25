import type { AppConfigService } from '@brickam/config-kit';
import { ForbiddenException, NotFoundException, ValidationException } from '@brickam/core-kit';
import type { ChatServiceContract, OrdersServiceContract } from '@brickam/domain-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateInvoiceDto } from './dto/invoice.dto';
import type { InvoicePdfService } from './invoice-pdf.service';
import type { InvoicesRepository } from './invoices.repository';
import { InvoicesService } from './invoices.service';

const FUTURE = new Date(Date.now() + 86_400_000);
const PAST = new Date(Date.now() - 86_400_000);

const makeInvoiceDoc = (over: Record<string, unknown> = {}) => ({
    id: 'inv1',
    _id: { toString: () => 'inv1' },
    invoiceNumber: 'INV-AAA-001',
    chatId: 'c1',
    vendorId: 'v1',
    buyerId: 'b1',
    lineItems: [{ title: 'A', qty: 2, price: 1000 }],
    subtotal: 2000,
    total: 2000,
    currency: 'AMD',
    validUntil: FUTURE,
    status: 'draft',
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-06-01'),
    ...over,
});

const makeDto = (over: Partial<CreateInvoiceDto> = {}): CreateInvoiceDto => ({
    chatId: 'c1',
    buyerId: 'b1',
    lineItems: [
        { title: 'A', qty: 2, price: 1000 },
        { title: 'B', qty: 1, price: 500 },
    ],
    validUntil: FUTURE.toISOString(),
    ...over,
});

describe('InvoicesService', () => {
    let repo: {
        create: ReturnType<typeof vi.fn>;
        updateById: ReturnType<typeof vi.fn>;
        findById: ReturnType<typeof vi.fn>;
        findByChat: ReturnType<typeof vi.fn>;
        findByNumber: ReturnType<typeof vi.fn>;
    };
    let orders: { createFromInvoice: ReturnType<typeof vi.fn> };
    let chat: { postInvoiceMessage: ReturnType<typeof vi.fn> };
    let pdfService: { generate: ReturnType<typeof vi.fn> };
    let config: { marketplace: { baseCurrency: string } };
    let service: InvoicesService;

    beforeEach(() => {
        repo = {
            create: vi.fn(),
            updateById: vi.fn(),
            findById: vi.fn(),
            findByChat: vi.fn().mockResolvedValue([]),
            findByNumber: vi.fn().mockResolvedValue(null),
        };
        orders = {
            createFromInvoice: vi.fn().mockResolvedValue({
                orderId: 'o1',
                orderNumber: 'ORD-1',
                paymentId: 'pay1',
                total: 2000,
            }),
        };
        chat = { postInvoiceMessage: vi.fn().mockResolvedValue(undefined) };
        pdfService = { generate: vi.fn() };
        config = { marketplace: { baseCurrency: 'AMD' } };
        service = new InvoicesService(
            repo as unknown as InvoicesRepository,
            orders as unknown as OrdersServiceContract,
            chat as unknown as ChatServiceContract,
            pdfService as unknown as InvoicePdfService,
            config as unknown as AppConfigService,
        );
    });

    describe('create', () => {
        it('считает subtotal/total, статус draft, номер задан, валюта из конфига', async () => {
            const created = makeInvoiceDoc({ subtotal: 2500, total: 2250 });
            repo.create.mockResolvedValue(created);
            repo.updateById.mockResolvedValue({ ...created, pdfUrl: '/api/invoices/inv1/pdf' });

            const result = await service.create(
                'v1',
                makeDto({ discount: { type: 'percent', value: 10 } }),
            );

            const arg = repo.create.mock.calls[0][0];
            expect(arg.subtotal).toBe(2500);
            expect(arg.total).toBe(2250);
            expect(arg.status).toBe('draft');
            expect(arg.currency).toBe('AMD');
            expect(arg.invoiceNumber).toMatch(/^INV-/);
            expect(arg.vendorId).toBe('v1');
            expect(result.pdfUrl).toBe('/api/invoices/inv1/pdf');
        });

        it('берёт валюту из dto, если задана', async () => {
            const created = makeInvoiceDoc({ currency: 'USD' });
            repo.create.mockResolvedValue(created);
            repo.updateById.mockResolvedValue(created);
            await service.create('v1', makeDto({ currency: 'USD' }));
            expect(repo.create.mock.calls[0][0].currency).toBe('USD');
        });
    });

    describe('send', () => {
        it('draft→sent и постит инвойс-сообщение в чат', async () => {
            repo.findById.mockResolvedValue(makeInvoiceDoc({ status: 'draft' }));
            repo.updateById.mockResolvedValue(makeInvoiceDoc({ status: 'sent' }));

            const result = await service.send('inv1', 'v1');

            expect(repo.updateById).toHaveBeenCalledWith('inv1', { status: 'sent' });
            expect(chat.postInvoiceMessage).toHaveBeenCalledWith('c1', 'v1', 'inv1');
            expect(result.status).toBe('sent');
        });

        it('повторный send (не draft) → ValidationException', async () => {
            repo.findById.mockResolvedValue(makeInvoiceDoc({ status: 'sent' }));
            await expect(service.send('inv1', 'v1')).rejects.toBeInstanceOf(ValidationException);
        });

        it('чужой вендор → ForbiddenException', async () => {
            repo.findById.mockResolvedValue(makeInvoiceDoc({ status: 'draft', vendorId: 'other' }));
            await expect(service.send('inv1', 'v1')).rejects.toBeInstanceOf(ForbiddenException);
        });
    });

    describe('pay', () => {
        it('просроченный sent → expired + ValidationException', async () => {
            repo.findById.mockResolvedValue(makeInvoiceDoc({ status: 'sent', validUntil: PAST }));
            await expect(service.pay('inv1', 'b1')).rejects.toBeInstanceOf(ValidationException);
            expect(repo.updateById).toHaveBeenCalledWith('inv1', { status: 'expired' });
            expect(orders.createFromInvoice).not.toHaveBeenCalled();
        });

        it('не-sent → ValidationException', async () => {
            repo.findById.mockResolvedValue(makeInvoiceDoc({ status: 'draft' }));
            await expect(service.pay('inv1', 'b1')).rejects.toBeInstanceOf(ValidationException);
        });

        it('чужой покупатель → ForbiddenException', async () => {
            repo.findById.mockResolvedValue(makeInvoiceDoc({ status: 'sent', buyerId: 'other' }));
            await expect(service.pay('inv1', 'b1')).rejects.toBeInstanceOf(ForbiddenException);
        });

        it('happy: createFromInvoice вызван, статус paid, orderId проставлен', async () => {
            repo.findById.mockResolvedValue(makeInvoiceDoc({ status: 'sent' }));
            repo.updateById.mockResolvedValue(makeInvoiceDoc({ status: 'paid', orderId: 'o1' }));

            const result = await service.pay('inv1', 'b1');

            expect(orders.createFromInvoice).toHaveBeenCalledWith(
                expect.objectContaining({
                    invoiceId: 'inv1',
                    buyerId: 'b1',
                    vendorId: 'v1',
                    currency: 'AMD',
                }),
            );
            expect(repo.updateById).toHaveBeenCalledWith('inv1', {
                status: 'paid',
                orderId: 'o1',
            });
            expect(result.orderId).toBe('o1');
            expect(result.paymentId).toBe('pay1');
            expect(result.invoice.status).toBe('paid');
            expect(result.invoice.orderId).toBe('o1');
        });
    });

    describe('cancel', () => {
        it('draft → cancelled', async () => {
            repo.findById.mockResolvedValue(makeInvoiceDoc({ status: 'draft' }));
            repo.updateById.mockResolvedValue(makeInvoiceDoc({ status: 'cancelled' }));
            const result = await service.cancel('inv1', 'v1');
            expect(result.status).toBe('cancelled');
        });

        it('paid → ValidationException', async () => {
            repo.findById.mockResolvedValue(makeInvoiceDoc({ status: 'paid' }));
            await expect(service.cancel('inv1', 'v1')).rejects.toBeInstanceOf(ValidationException);
        });
    });

    describe('getById', () => {
        it('не найден → NotFoundException', async () => {
            repo.findById.mockResolvedValue(null);
            await expect(service.getById('inv1')).rejects.toBeInstanceOf(NotFoundException);
        });

        it('просроченный sent → expired при чтении', async () => {
            repo.findById.mockResolvedValue(makeInvoiceDoc({ status: 'sent', validUntil: PAST }));
            repo.updateById.mockResolvedValue(
                makeInvoiceDoc({ status: 'expired', validUntil: PAST }),
            );
            const result = await service.getById('inv1');
            expect(repo.updateById).toHaveBeenCalledWith('inv1', { status: 'expired' });
            expect(result.status).toBe('expired');
        });
    });

    describe('getByChat', () => {
        it('возвращает инвойсы диалога с авто-expire', async () => {
            repo.findByChat.mockResolvedValue([makeInvoiceDoc({ status: 'draft' })]);
            const result = await service.getByChat('c1');
            expect(result).toHaveLength(1);
            expect(result[0].chatId).toBe('c1');
        });
    });

    describe('pdf', () => {
        it('делегирует генерацию в InvoicePdfService', async () => {
            repo.findById.mockResolvedValue(makeInvoiceDoc());
            pdfService.generate.mockResolvedValue(Buffer.from('pdf'));
            const buffer = await service.pdf('inv1');
            expect(pdfService.generate).toHaveBeenCalled();
            expect(buffer.length).toBeGreaterThan(0);
        });
    });
});
