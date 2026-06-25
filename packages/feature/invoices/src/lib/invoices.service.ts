import { AppConfigService } from '@brickam/config-kit';
import { ForbiddenException, NotFoundException, ValidationException } from '@brickam/core-kit';
import { ChatServiceContract, OrdersServiceContract } from '@brickam/domain-kit';
import { Injectable } from '@nestjs/common';
import type { InvoiceContract, InvoicePayResult } from '../@types';
import type { CreateInvoiceDto } from './dto/invoice.dto';
import type { InvoiceDocument } from './invoice.schema';
import { computeTotals, isExpired } from './invoice-calc.util';
import { InvoicePdfService } from './invoice-pdf.service';
import { InvoicesRepository } from './invoices.repository';

/**
 * Сервис кастомных инвойсов (Foundations §15, Stage 9). Продавец с правом
 * `invoices.create` формирует инвойс покупателю в диалоге; оплата → заказ
 * (через orders, §11). Авто-expire по validUntil. Границы feature:
 * orders/chat доступны только по DI-контрактам из domain-kit.
 */
@Injectable()
export class InvoicesService {
    constructor(
        private readonly invoicesRepository: InvoicesRepository,
        private readonly orders: OrdersServiceContract,
        private readonly chat: ChatServiceContract,
        private readonly pdfService: InvoicePdfService,
        private readonly config: AppConfigService,
    ) {}

    /** Маппит документ инвойса в плоский контракт. */
    private toContract(doc: InvoiceDocument): InvoiceContract {
        const contract: InvoiceContract = {
            id: doc.id ?? doc._id.toString(),
            invoiceNumber: doc.invoiceNumber,
            chatId: doc.chatId,
            vendorId: doc.vendorId,
            buyerId: doc.buyerId,
            lineItems: doc.lineItems.map((item) => ({
                title: item.title,
                qty: item.qty,
                price: item.price,
            })),
            subtotal: doc.subtotal,
            total: doc.total,
            currency: doc.currency,
            validUntil: doc.validUntil,
            status: doc.status,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };
        if (doc.discount) {
            contract.discount = { type: doc.discount.type, value: doc.discount.value };
        }
        if (doc.orderId !== undefined) {
            contract.orderId = doc.orderId;
        }
        if (doc.pdfUrl !== undefined) {
            contract.pdfUrl = doc.pdfUrl;
        }
        return contract;
    }

    /** Генерирует уникальный номер инвойса (INV- + base36 времени + суффикс). */
    private generateInvoiceNumber(): string {
        const base = Date.now().toString(36).toUpperCase();
        const suffix = Math.floor(Math.random() * 36 ** 3)
            .toString(36)
            .toUpperCase()
            .padStart(3, '0');
        return `INV-${base}-${suffix}`;
    }

    /**
     * Создаёт инвойс (status draft). Считает subtotal/total, генерирует номер,
     * валюта = dto.currency ?? baseCurrency. pdfUrl проставляется после
     * создания (нужен id документа).
     */
    async create(vendorId: string, dto: CreateInvoiceDto): Promise<InvoiceContract> {
        const discount = dto.discount
            ? { type: dto.discount.type, value: dto.discount.value }
            : undefined;
        const lineItems = dto.lineItems.map((item) => ({
            title: item.title,
            qty: item.qty,
            price: item.price,
        }));
        const { subtotal, total } = computeTotals(lineItems, discount);
        const currency = dto.currency ?? this.config.marketplace.baseCurrency;

        const created = await this.invoicesRepository.create({
            invoiceNumber: this.generateInvoiceNumber(),
            chatId: dto.chatId,
            vendorId,
            buyerId: dto.buyerId,
            lineItems,
            ...(discount ? { discount } : {}),
            subtotal,
            total,
            currency,
            validUntil: new Date(dto.validUntil),
            status: 'draft',
        });

        const pdfUrl = `/api/invoices/${created.id}/pdf`;
        const withPdf = await this.invoicesRepository.updateById(created.id, { pdfUrl });
        return this.toContract(withPdf ?? created);
    }

    /** Отправляет инвойс в чат: draft→sent, постит инвойс-сообщение. */
    async send(invoiceId: string, vendorId: string): Promise<InvoiceContract> {
        const invoice = await this.invoicesRepository.findById(invoiceId);
        if (!invoice) {
            throw new NotFoundException('errors.invoices.notFound');
        }
        if (invoice.vendorId !== vendorId) {
            throw new ForbiddenException('errors.invoices.notOwner');
        }
        if (invoice.status !== 'draft') {
            throw new ValidationException('errors.invoices.notDraft');
        }

        const updated = await this.invoicesRepository.updateById(invoiceId, { status: 'sent' });
        if (!updated) {
            throw new NotFoundException('errors.invoices.notFound');
        }
        await this.chat.postInvoiceMessage(updated.chatId, vendorId, invoiceId);
        return this.toContract(updated);
    }

    /**
     * Оплата инвойса покупателем → заказ. Просроченный sent → expired +
     * ValidationException; статус должен быть sent; чужой покупатель → Forbidden.
     */
    async pay(invoiceId: string, buyerId: string): Promise<InvoicePayResult> {
        const invoice = await this.invoicesRepository.findById(invoiceId);
        if (!invoice) {
            throw new NotFoundException('errors.invoices.notFound');
        }
        if (invoice.buyerId !== buyerId) {
            throw new ForbiddenException('errors.invoices.notBuyer');
        }
        if (invoice.status === 'sent' && isExpired(invoice.validUntil)) {
            await this.invoicesRepository.updateById(invoiceId, { status: 'expired' });
            throw new ValidationException('errors.invoices.expired');
        }
        if (invoice.status !== 'sent') {
            throw new ValidationException('errors.invoices.notSent');
        }

        const result = await this.orders.createFromInvoice({
            invoiceId,
            buyerId,
            vendorId: invoice.vendorId,
            lineItems: invoice.lineItems.map((item) => ({
                title: item.title,
                qty: item.qty,
                price: item.price,
            })),
            ...(invoice.discount
                ? { discount: { type: invoice.discount.type, value: invoice.discount.value } }
                : {}),
            currency: invoice.currency,
        });

        const updated = await this.invoicesRepository.updateById(invoiceId, {
            status: 'paid',
            orderId: result.orderId,
        });
        if (!updated) {
            throw new NotFoundException('errors.invoices.notFound');
        }
        return {
            invoice: this.toContract(updated),
            orderId: result.orderId,
            paymentId: result.paymentId,
        };
    }

    /** Отменяет инвойс: draft|sent → cancelled. */
    async cancel(invoiceId: string, vendorId: string): Promise<InvoiceContract> {
        const invoice = await this.invoicesRepository.findById(invoiceId);
        if (!invoice) {
            throw new NotFoundException('errors.invoices.notFound');
        }
        if (invoice.vendorId !== vendorId) {
            throw new ForbiddenException('errors.invoices.notOwner');
        }
        if (invoice.status !== 'draft' && invoice.status !== 'sent') {
            throw new ValidationException('errors.invoices.notCancellable');
        }
        const updated = await this.invoicesRepository.updateById(invoiceId, {
            status: 'cancelled',
        });
        if (!updated) {
            throw new NotFoundException('errors.invoices.notFound');
        }
        return this.toContract(updated);
    }

    /** Инвойс по id (с авто-expire при чтении). */
    async getById(id: string): Promise<InvoiceContract> {
        const invoice = await this.invoicesRepository.findById(id);
        if (!invoice) {
            throw new NotFoundException('errors.invoices.notFound');
        }
        const fresh = await this.refreshExpiry(invoice);
        return this.toContract(fresh);
    }

    /** Инвойсы диалога (с авто-expire при чтении). */
    async getByChat(chatId: string): Promise<InvoiceContract[]> {
        const invoices = await this.invoicesRepository.findByChat(chatId);
        const fresh = await Promise.all(invoices.map((invoice) => this.refreshExpiry(invoice)));
        return fresh.map((invoice) => this.toContract(invoice));
    }

    /** Возвращает PDF инвойса как Buffer. */
    async pdf(invoiceId: string): Promise<Buffer> {
        const invoice = await this.invoicesRepository.findById(invoiceId);
        if (!invoice) {
            throw new NotFoundException('errors.invoices.notFound');
        }
        return this.pdfService.generate(invoice);
    }

    /** Если sent и просрочен → переводит в expired (возвращает свежий документ). */
    async refreshExpiry(invoice: InvoiceDocument): Promise<InvoiceDocument> {
        if (invoice.status === 'sent' && isExpired(invoice.validUntil)) {
            const updated = await this.invoicesRepository.updateById(invoice.id, {
                status: 'expired',
            });
            return updated ?? invoice;
        }
        return invoice;
    }
}
