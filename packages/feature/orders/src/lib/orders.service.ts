import { AppConfigService } from '@brickam/config-kit';
import {
    ForbiddenException,
    NotFoundException,
    type Page,
    ValidationException,
} from '@brickam/core-kit';
import {
    CatalogServiceContract,
    calculateOrder,
    type DeliveryStatus,
    type OrderLineInput,
    OrderStatus,
    PaymentStatus,
    PaymentsServiceContract,
} from '@brickam/domain-kit';
import { Injectable } from '@nestjs/common';
import type {
    CheckoutResult,
    OrderContract,
    VendorOrderContract,
    VendorOrderItemContract,
} from '../@types';
import { CartsRepository } from './carts.repository';
import { DeliveryAddressesRepository } from './delivery-addresses.repository';
import type { CheckoutDto } from './dto/checkout.dto';
import type { OrdersQueryDto } from './dto/orders-query.dto';
import type { Order, OrderDocument } from './order.schema';
import { generateOrderNumber } from './order-number.util';
import { OrdersRepository } from './orders.repository';
import type { VendorOrder, VendorOrderDocument } from './vendor-order.schema';
import { VendorOrdersRepository } from './vendor-orders.repository';

/** Допустимые переходы статусов заказа (Foundations §15). */
const ORDER_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
    [OrderStatus.Created]: [OrderStatus.Paid, OrderStatus.Cancelled],
    [OrderStatus.Paid]: [OrderStatus.Processing, OrderStatus.Cancelled],
    [OrderStatus.Processing]: [OrderStatus.Completed, OrderStatus.Cancelled],
    [OrderStatus.Completed]: [],
    [OrderStatus.Cancelled]: [],
};

/**
 * Сервис заказов (Foundations §11/§15). Считает заказ через domain-kit
 * (calculateOrder — расчёт не дублируется), создаёт Order + по VendorOrder на
 * каждого вендора + один платёж с разбивкой splits[]. Эскроу нет.
 */
@Injectable()
export class OrdersService {
    constructor(
        private readonly cartsRepository: CartsRepository,
        private readonly ordersRepository: OrdersRepository,
        private readonly vendorOrdersRepository: VendorOrdersRepository,
        private readonly deliveryAddressesRepository: DeliveryAddressesRepository,
        private readonly catalog: CatalogServiceContract,
        private readonly payments: PaymentsServiceContract,
        private readonly config: AppConfigService,
    ) {}

    /** Маппит документ заказа в плоский контракт. */
    private toOrderContract(doc: OrderDocument): OrderContract {
        const contract: OrderContract = {
            id: doc.id ?? doc._id.toString(),
            orderNumber: doc.orderNumber,
            buyerId: doc.buyerId,
            status: doc.status,
            subtotal: doc.subtotal,
            productDiscountTotal: doc.productDiscountTotal,
            loyaltyDiscount: doc.loyaltyDiscount,
            total: doc.total,
            currencyShown: doc.currencyShown,
            deliveryAddressSnapshot: {
                label: doc.deliveryAddressSnapshot.label,
                region: doc.deliveryAddressSnapshot.region,
                city: doc.deliveryAddressSnapshot.city,
                line1: doc.deliveryAddressSnapshot.line1,
                phone: doc.deliveryAddressSnapshot.phone,
                ...(doc.deliveryAddressSnapshot.line2 !== undefined
                    ? { line2: doc.deliveryAddressSnapshot.line2 }
                    : {}),
            },
        };
        if (doc.paymentId !== undefined) {
            contract.paymentId = doc.paymentId;
        }
        return contract;
    }

    /** Маппит документ саб-заказа вендора в плоский контракт. */
    private toVendorOrderContract(doc: VendorOrderDocument): VendorOrderContract {
        return {
            id: doc.id ?? doc._id.toString(),
            orderId: doc.orderId,
            vendorId: doc.vendorId,
            items: doc.items.map((item) => {
                const mapped: VendorOrderItemContract = {
                    productId: item.productId,
                    qty: item.qty,
                    unitPrice: item.unitPrice,
                    discountApplied: item.discountApplied,
                    lineTotal: item.lineTotal,
                };
                if (item.titleSnapshot !== undefined) {
                    mapped.titleSnapshot = item.titleSnapshot;
                }
                return mapped;
            }),
            subtotal: doc.subtotal,
            commissionPercentSnapshot: doc.commissionPercentSnapshot,
            commissionAmount: doc.commissionAmount,
            payoutAmount: doc.payoutAmount,
            deliveryStatus: doc.deliveryStatus,
            deliveryEvents: doc.deliveryEvents.map((event) => ({
                status: event.status,
                at: event.at,
                ...(event.note !== undefined ? { note: event.note } : {}),
            })),
        };
    }

    /**
     * Оформляет заказ из корзины:
     * 1. грузит корзину (пусто → ValidationException);
     * 2. строит OrderLineInput[] из снимков позиций;
     * 3. считает заказ через domain-kit calculateOrder;
     * 4. проверяет остатки по снимкам каталога (нехватка → ValidationException);
     * 5. создаёт Order (created) + по VendorOrder на каждого вендора;
     * 6. списывает остатки decrementStock по каждой позиции;
     * 7. создаёт ОДИН платёж на total с splits[]; проставляет paymentId;
     * 8. очищает корзину.
     */
    async checkout(buyerId: string, dto: CheckoutDto): Promise<CheckoutResult> {
        const cart = await this.cartsRepository.findByBuyer(buyerId);
        if (!cart || cart.items.length === 0) {
            throw new ValidationException('errors.orders.emptyCart');
        }

        // Снимки товаров каталога: цена для расчёта берётся из корзины (priceSnapshot),
        // но остаток проверяем по актуальному снимку перед списанием.
        const lines: OrderLineInput[] = [];
        for (const item of cart.items) {
            const snapshot = await this.catalog.getProductSnapshot(item.productId);
            if (!snapshot) {
                throw new NotFoundException('errors.catalog.productNotFound', {
                    productId: item.productId,
                });
            }
            if (snapshot.stock < item.qty) {
                throw new ValidationException('errors.orders.insufficientStock', {
                    productId: item.productId,
                });
            }
            lines.push({
                productId: item.productId,
                vendorId: item.vendorId,
                qty: item.qty,
                price: item.priceSnapshot,
                ...(item.discountSnapshot !== undefined ? { discount: item.discountSnapshot } : {}),
                ...(snapshot.title !== undefined ? { titleSnapshot: snapshot.title } : {}),
            });
        }

        const result = calculateOrder(lines, this.config.marketplace.commissionPercent);

        const orderNumber = generateOrderNumber();
        const orderDoc = await this.ordersRepository.create({
            orderNumber,
            buyerId,
            status: OrderStatus.Created,
            subtotal: result.subtotal,
            productDiscountTotal: result.productDiscountTotal,
            loyaltyDiscount: result.loyaltyDiscount,
            total: result.total,
            currencyShown: this.config.marketplace.baseCurrency,
            deliveryAddressSnapshot: {
                label: dto.deliveryAddress.label,
                region: dto.deliveryAddress.region,
                city: dto.deliveryAddress.city,
                line1: dto.deliveryAddress.line1,
                phone: dto.deliveryAddress.phone,
                ...(dto.deliveryAddress.line2 !== undefined
                    ? { line2: dto.deliveryAddress.line2 }
                    : {}),
            },
        } as Partial<Order>);
        const orderId = orderDoc.id ?? orderDoc._id.toString();

        const vendorOrderDocs: VendorOrderDocument[] = [];
        for (const vendor of result.vendors) {
            const vendorOrder = await this.vendorOrdersRepository.create({
                orderId,
                vendorId: vendor.vendorId,
                items: vendor.items,
                subtotal: vendor.subtotal,
                commissionPercentSnapshot: vendor.commissionPercent,
                commissionAmount: vendor.commissionAmount,
                payoutAmount: vendor.payoutAmount,
            } as Partial<VendorOrder>);
            vendorOrderDocs.push(vendorOrder);
        }

        // Списываем остатки по каждой позиции (бросит при нехватке).
        for (const item of cart.items) {
            await this.catalog.decrementStock(item.productId, item.qty);
        }

        const payment = await this.payments.createForOrder({
            orderId,
            buyerId,
            amount: result.total,
            splits: result.splits,
        });

        const updated = await this.ordersRepository.updateById(orderId, {
            paymentId: payment.paymentId,
        });

        await this.cartsRepository.updateById(cart.id ?? cart._id.toString(), { items: [] });

        return {
            order: this.toOrderContract(updated ?? orderDoc),
            vendorOrders: vendorOrderDocs.map((doc) => this.toVendorOrderContract(doc)),
            payment,
            splits: result.splits,
        };
    }

    /** Подтверждает оплату заказа: confirm → succeeded → status Paid. */
    async pay(orderId: string, buyerId: string): Promise<OrderContract> {
        const doc = await this.loadOwned(orderId, buyerId);
        if (!doc.paymentId) {
            throw new ValidationException('errors.orders.noPayment');
        }
        const result = await this.payments.confirm(doc.paymentId);
        if (result.status === PaymentStatus.Succeeded) {
            const updated = await this.ordersRepository.updateById(orderId, {
                status: OrderStatus.Paid,
            });
            return this.toOrderContract(updated ?? doc);
        }
        return this.toOrderContract(doc);
    }

    /** Переводит заказ в новый статус (валидный переход — иначе ValidationException). */
    async advanceStatus(orderId: string, status: OrderStatus): Promise<OrderContract> {
        const doc = await this.ordersRepository.findById(orderId);
        if (!doc) {
            throw new NotFoundException();
        }
        const allowed = ORDER_TRANSITIONS[doc.status];
        if (!allowed.includes(status)) {
            throw new ValidationException('errors.orders.invalidTransition', {
                from: doc.status,
                to: status,
            });
        }
        const updated = await this.ordersRepository.updateById(orderId, { status });
        return this.toOrderContract(updated ?? doc);
    }

    /** Меняет статус доставки саб-заказа и добавляет событие в историю. */
    async updateDelivery(
        vendorOrderId: string,
        status: DeliveryStatus,
        note?: string,
    ): Promise<VendorOrderContract> {
        const doc = await this.vendorOrdersRepository.findById(vendorOrderId);
        if (!doc) {
            throw new NotFoundException();
        }
        doc.deliveryStatus = status;
        doc.deliveryEvents.push({
            status,
            at: new Date(),
            ...(note !== undefined ? { note } : {}),
        } as VendorOrderDocument['deliveryEvents'][number]);
        await doc.save();
        return this.toVendorOrderContract(doc);
    }

    /** Возвращает заказ покупателя (404/403 при чужом). */
    async getOrder(id: string, buyerId: string): Promise<OrderContract> {
        const doc = await this.loadOwned(id, buyerId);
        return this.toOrderContract(doc);
    }

    /** Сохранённые адреса доставки пользователя (для подстановки в checkout). */
    listAddresses(userId: string): Promise<unknown[]> {
        return this.deliveryAddressesRepository.findByUser(userId);
    }

    /** Постраничный список заказов покупателя. */
    async listOrders(buyerId: string, query: OrdersQueryDto): Promise<Page<OrderContract>> {
        const pageSize = Math.min(query.pageSize, this.config.pagination.maxPageSize);
        const page = await this.ordersRepository.findByBuyer(buyerId, {
            page: query.page,
            pageSize,
        });
        return {
            data: page.data.map((doc) => this.toOrderContract(doc)),
            meta: page.meta,
        };
    }

    /** Грузит заказ и проверяет владельца (404 если нет, 403 если чужой). */
    private async loadOwned(id: string, buyerId: string): Promise<OrderDocument> {
        const doc = await this.ordersRepository.findById(id);
        if (!doc) {
            throw new NotFoundException();
        }
        if (doc.buyerId !== buyerId) {
            throw new ForbiddenException();
        }
        return doc;
    }
}
