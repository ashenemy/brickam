import type { AppConfigService } from '@brickam/config-kit';
import { ForbiddenException, NotFoundException, ValidationException } from '@brickam/core-kit';
import type { TransactionRunner, TxContext } from '@brickam/db-kit';
import {
    type CatalogServiceContract,
    DeliveryStatus,
    type LoyaltyServiceContract,
    OrderStatus,
    PaymentStatus,
    type PaymentsServiceContract,
    type ProductSnapshot,
} from '@brickam/domain-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CartsRepository } from './carts.repository';
import type { DeliveryAddressesRepository } from './delivery-addresses.repository';
import type { CheckoutDto } from './dto/checkout.dto';
import type { OrdersQueryDto } from './dto/orders-query.dto';
import type { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';
import type { VendorOrdersRepository } from './vendor-orders.repository';

const checkoutDto: CheckoutDto = {
    deliveryAddress: {
        label: 'Дом',
        region: 'yerevan',
        city: 'Ереван',
        line1: 'ул. 1',
        phone: '+37400000000',
    },
};

const snapshots: Record<string, ProductSnapshot> = {
    p1: {
        id: 'p1',
        vendorId: 'v1',
        title: { hy: 'ц', ru: 'Цемент', en: 'Cement' },
        unit: 'bag',
        price: 1000,
        stock: 10,
    },
    p2: {
        id: 'p2',
        vendorId: 'v2',
        title: { hy: 'к', ru: 'Кирпич', en: 'Brick' },
        unit: 'pcs',
        price: 500,
        stock: 10,
        discount: { type: 'percent', value: 20 },
    },
};

const makeCart = () => ({
    id: 'cart1',
    _id: { toString: () => 'cart1' },
    items: [
        { productId: 'p1', vendorId: 'v1', qty: 2, priceSnapshot: 1000 },
        {
            productId: 'p2',
            vendorId: 'v2',
            qty: 1,
            priceSnapshot: 500,
            discountSnapshot: { type: 'percent', value: 20 },
        },
    ],
});

describe('OrdersService', () => {
    let cartsRepo: {
        findByBuyer: ReturnType<typeof vi.fn>;
        updateById: ReturnType<typeof vi.fn>;
    };
    let ordersRepo: {
        create: ReturnType<typeof vi.fn>;
        updateById: ReturnType<typeof vi.fn>;
        findById: ReturnType<typeof vi.fn>;
        findByBuyer: ReturnType<typeof vi.fn>;
    };
    let vendorOrdersRepo: {
        create: ReturnType<typeof vi.fn>;
        findById: ReturnType<typeof vi.fn>;
        findByVendor: ReturnType<typeof vi.fn>;
        aggregate: ReturnType<typeof vi.fn>;
    };
    let deliveryRepo: { findByUser: ReturnType<typeof vi.fn> };
    let catalog: {
        getProductSnapshot: ReturnType<typeof vi.fn>;
        decrementStock: ReturnType<typeof vi.fn>;
    };
    let payments: {
        createForOrder: ReturnType<typeof vi.fn>;
        confirm: ReturnType<typeof vi.fn>;
        getByOrder: ReturnType<typeof vi.fn>;
    };
    let loyalty: {
        previewDiscount: ReturnType<typeof vi.fn>;
        recordCompletedOrder: ReturnType<typeof vi.fn>;
    };
    let service: OrdersService;

    beforeEach(() => {
        cartsRepo = {
            findByBuyer: vi.fn(),
            updateById: vi.fn().mockResolvedValue(undefined),
        };
        ordersRepo = {
            create: vi.fn(),
            updateById: vi.fn(),
            findById: vi.fn(),
            findByBuyer: vi.fn(),
        };
        vendorOrdersRepo = {
            create: vi.fn(),
            findById: vi.fn(),
            findByVendor: vi.fn(),
            aggregate: vi.fn(),
        };
        deliveryRepo = { findByUser: vi.fn() };
        catalog = {
            getProductSnapshot: vi.fn((id: string) => Promise.resolve(snapshots[id] ?? null)),
            decrementStock: vi.fn().mockResolvedValue(undefined),
        };
        payments = {
            createForOrder: vi
                .fn()
                .mockResolvedValue({ paymentId: 'pay1', status: PaymentStatus.Pending }),
            confirm: vi.fn(),
            getByOrder: vi.fn(),
        };
        const config = {
            marketplace: { commissionPercent: 10, baseCurrency: 'AMD' },
            pagination: { maxPageSize: 50 },
        } as unknown as AppConfigService;

        loyalty = {
            previewDiscount: vi.fn().mockResolvedValue({ loyaltyDiscount: 0 }),
            recordCompletedOrder: vi.fn().mockResolvedValue(undefined),
        };

        service = new OrdersService(
            cartsRepo as unknown as CartsRepository,
            ordersRepo as unknown as OrdersRepository,
            vendorOrdersRepo as unknown as VendorOrdersRepository,
            deliveryRepo as unknown as DeliveryAddressesRepository,
            catalog as unknown as CatalogServiceContract,
            payments as unknown as PaymentsServiceContract,
            loyalty as unknown as LoyaltyServiceContract,
            config,
        );
    });

    describe('checkout', () => {
        beforeEach(() => {
            cartsRepo.findByBuyer.mockResolvedValue(makeCart());
            ordersRepo.create.mockImplementation((data: Record<string, unknown>) =>
                Promise.resolve({
                    id: 'order1',
                    _id: { toString: () => 'order1' },
                    paymentId: undefined,
                    ...data,
                }),
            );
            ordersRepo.updateById.mockImplementation((_id: string, upd: Record<string, unknown>) =>
                Promise.resolve({
                    id: 'order1',
                    _id: { toString: () => 'order1' },
                    orderNumber: 'BH-X',
                    buyerId: 'b1',
                    status: OrderStatus.Created,
                    subtotal: 2500,
                    productDiscountTotal: 100,
                    loyaltyDiscount: 0,
                    total: 2400,
                    currencyShown: 'AMD',
                    deliveryAddressSnapshot: checkoutDto.deliveryAddress,
                    ...upd,
                }),
            );
            let n = 0;
            vendorOrdersRepo.create.mockImplementation((data: Record<string, unknown>) => {
                n += 1;
                return Promise.resolve({
                    id: `vo${n}`,
                    _id: { toString: () => `vo${n}` },
                    deliveryStatus: DeliveryStatus.Accepted,
                    deliveryEvents: [],
                    ...data,
                });
            });
        });

        it('считает заказ и создаёт Order с верными суммами (§11)', async () => {
            const result = await service.checkout('b1', checkoutDto);

            const orderArg = ordersRepo.create.mock.calls[0]?.[0] as Record<string, number>;
            expect(orderArg['subtotal']).toBe(2500);
            expect(orderArg['productDiscountTotal']).toBe(100);
            expect(orderArg['loyaltyDiscount']).toBe(0);
            expect(orderArg['total']).toBe(2400);
            expect(result.order.total).toBe(2400);
        });

        it('создаёт по VendorOrder на вендора с верной комиссией/выплатой', async () => {
            await service.checkout('b1', checkoutDto);

            expect(vendorOrdersRepo.create).toHaveBeenCalledTimes(2);
            const calls = vendorOrdersRepo.create.mock.calls.map(
                (c) => c[0] as Record<string, number | string>,
            );
            const v1 = calls.find((c) => c['vendorId'] === 'v1');
            const v2 = calls.find((c) => c['vendorId'] === 'v2');

            expect(v1).toMatchObject({
                subtotal: 2000,
                commissionPercentSnapshot: 10,
                commissionAmount: 200,
                payoutAmount: 1800,
            });
            expect(v2).toMatchObject({
                subtotal: 400,
                commissionPercentSnapshot: 10,
                commissionAmount: 40,
                payoutAmount: 360,
            });
        });

        it('списывает остаток по каждой позиции', async () => {
            await service.checkout('b1', checkoutDto);

            expect(catalog.decrementStock).toHaveBeenCalledTimes(2);
            // 3-й аргумент — session (undefined без TransactionRunner в юнит-тесте).
            expect(catalog.decrementStock).toHaveBeenCalledWith('p1', 2, undefined);
            expect(catalog.decrementStock).toHaveBeenCalledWith('p2', 1, undefined);
        });

        it('создаёт один платёж на total со splits (сумма splits === total)', async () => {
            const result = await service.checkout('b1', checkoutDto);

            expect(payments.createForOrder).toHaveBeenCalledTimes(1);
            const payArg = payments.createForOrder.mock.calls[0]?.[0] as {
                amount: number;
                splits: Array<{ amount: number }>;
            };
            expect(payArg.amount).toBe(2400);
            const splitSum = payArg.splits.reduce((acc, s) => acc + s.amount, 0);
            expect(splitSum).toBe(2400);
            expect(result.order.paymentId).toBe('pay1');
        });

        it('очищает корзину после оформления', async () => {
            await service.checkout('b1', checkoutDto);
            expect(cartsRepo.updateById).toHaveBeenCalledWith('cart1', { items: [] }, undefined);
        });

        it('с TransactionRunner прокидывает session во все записи (атомарность §11)', async () => {
            const SESSION = { id: 'sess' };
            const txRunner = {
                run: vi.fn((work: (ctx: TxContext) => Promise<unknown>) =>
                    work({ session: SESSION as never }),
                ),
            };
            const cfg = {
                marketplace: { commissionPercent: 10, baseCurrency: 'AMD' },
                pagination: { maxPageSize: 50 },
            } as unknown as AppConfigService;
            const txService = new OrdersService(
                cartsRepo as unknown as CartsRepository,
                ordersRepo as unknown as OrdersRepository,
                vendorOrdersRepo as unknown as VendorOrdersRepository,
                deliveryRepo as unknown as DeliveryAddressesRepository,
                catalog as unknown as CatalogServiceContract,
                payments as unknown as PaymentsServiceContract,
                loyalty as unknown as LoyaltyServiceContract,
                cfg,
                undefined,
                txRunner as unknown as TransactionRunner,
            );

            await txService.checkout('b1', checkoutDto);

            expect(txRunner.run).toHaveBeenCalledTimes(1);
            expect(ordersRepo.create).toHaveBeenCalledWith(expect.any(Object), SESSION);
            expect(catalog.decrementStock).toHaveBeenCalledWith('p1', 2, SESSION);
            expect(cartsRepo.updateById).toHaveBeenCalledWith('cart1', { items: [] }, SESSION);
        });

        it('бросает ValidationException на пустой корзине', async () => {
            cartsRepo.findByBuyer.mockResolvedValue({ id: 'c', _id: {}, items: [] });
            await expect(service.checkout('b1', checkoutDto)).rejects.toMatchObject({
                messageKey: 'errors.orders.emptyCart',
            });
        });

        it('бросает ValidationException при нехватке остатка', async () => {
            catalog.getProductSnapshot.mockImplementation((id: string) =>
                Promise.resolve(
                    id === 'p1' ? { ...snapshots['p1'], stock: 1 } : (snapshots[id] ?? null),
                ),
            );
            await expect(service.checkout('b1', checkoutDto)).rejects.toBeInstanceOf(
                ValidationException,
            );
            expect(catalog.decrementStock).not.toHaveBeenCalled();
        });
    });

    describe('pay', () => {
        it('подтверждает платёж и переводит в Paid при succeeded', async () => {
            ordersRepo.findById.mockResolvedValue({
                id: 'order1',
                _id: { toString: () => 'order1' },
                buyerId: 'b1',
                paymentId: 'pay1',
                status: OrderStatus.Created,
                deliveryAddressSnapshot: checkoutDto.deliveryAddress,
            });
            payments.confirm.mockResolvedValue({
                paymentId: 'pay1',
                status: PaymentStatus.Succeeded,
            });
            ordersRepo.updateById.mockResolvedValue({
                id: 'order1',
                _id: { toString: () => 'order1' },
                buyerId: 'b1',
                status: OrderStatus.Paid,
                paymentId: 'pay1',
                deliveryAddressSnapshot: checkoutDto.deliveryAddress,
            });

            const result = await service.pay('order1', 'b1');

            expect(payments.confirm).toHaveBeenCalledWith('pay1');
            expect(result.status).toBe(OrderStatus.Paid);
        });

        it('бросает Forbidden при чужом заказе', async () => {
            ordersRepo.findById.mockResolvedValue({
                id: 'order1',
                _id: { toString: () => 'order1' },
                buyerId: 'other',
                paymentId: 'pay1',
            });
            await expect(service.pay('order1', 'b1')).rejects.toBeInstanceOf(ForbiddenException);
        });

        it('бросает NotFound, если заказа нет', async () => {
            ordersRepo.findById.mockResolvedValue(null);
            await expect(service.pay('orderX', 'b1')).rejects.toBeInstanceOf(NotFoundException);
        });

        it('не переводит в Paid, если платёж не succeeded', async () => {
            ordersRepo.findById.mockResolvedValue({
                id: 'order1',
                _id: { toString: () => 'order1' },
                buyerId: 'b1',
                paymentId: 'pay1',
                status: OrderStatus.Created,
                deliveryAddressSnapshot: checkoutDto.deliveryAddress,
            });
            payments.confirm.mockResolvedValue({
                paymentId: 'pay1',
                status: PaymentStatus.Failed,
            });
            const result = await service.pay('order1', 'b1');
            expect(result.status).toBe(OrderStatus.Created);
            expect(ordersRepo.updateById).not.toHaveBeenCalled();
        });

        it('бросает ValidationException, если у заказа нет платежа', async () => {
            ordersRepo.findById.mockResolvedValue({
                id: 'order1',
                _id: { toString: () => 'order1' },
                buyerId: 'b1',
                status: OrderStatus.Created,
                deliveryAddressSnapshot: checkoutDto.deliveryAddress,
            });
            await expect(service.pay('order1', 'b1')).rejects.toBeInstanceOf(ValidationException);
        });
    });

    describe('getOrder / listAddresses', () => {
        it('getOrder возвращает заказ владельца', async () => {
            ordersRepo.findById.mockResolvedValue({
                id: 'order1',
                _id: { toString: () => 'order1' },
                buyerId: 'b1',
                status: OrderStatus.Created,
                deliveryAddressSnapshot: checkoutDto.deliveryAddress,
            });
            const result = await service.getOrder('order1', 'b1');
            expect(result.id).toBe('order1');
        });

        it('listAddresses делегирует репозиторию', async () => {
            deliveryRepo.findByUser.mockResolvedValue([{ id: 'a1' }]);
            const result = await service.listAddresses('u1');
            expect(deliveryRepo.findByUser).toHaveBeenCalledWith('u1');
            expect(result).toHaveLength(1);
        });
    });

    describe('advanceStatus', () => {
        const orderWith = (status: OrderStatus) => ({
            id: 'order1',
            _id: { toString: () => 'order1' },
            buyerId: 'b1',
            status,
            deliveryAddressSnapshot: checkoutDto.deliveryAddress,
        });

        it('разрешает валидный переход created → paid', async () => {
            ordersRepo.findById.mockResolvedValue(orderWith(OrderStatus.Created));
            ordersRepo.updateById.mockResolvedValue({
                ...orderWith(OrderStatus.Paid),
            });

            const result = await service.advanceStatus('order1', OrderStatus.Paid);
            expect(result.status).toBe(OrderStatus.Paid);
            expect(ordersRepo.updateById).toHaveBeenCalledWith('order1', {
                status: OrderStatus.Paid,
            });
        });

        it('бросает ValidationException на неверном переходе created → completed', async () => {
            ordersRepo.findById.mockResolvedValue(orderWith(OrderStatus.Created));
            await expect(
                service.advanceStatus('order1', OrderStatus.Completed),
            ).rejects.toBeInstanceOf(ValidationException);
        });

        it('бросает NotFound, если заказа нет', async () => {
            ordersRepo.findById.mockResolvedValue(null);
            await expect(service.advanceStatus('orderX', OrderStatus.Paid)).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });
    });

    describe('updateDelivery', () => {
        it('меняет статус и добавляет событие', async () => {
            const doc = {
                id: 'vo1',
                _id: { toString: () => 'vo1' },
                orderId: 'order1',
                vendorId: 'v1',
                items: [],
                subtotal: 2000,
                commissionPercentSnapshot: 10,
                commissionAmount: 200,
                payoutAmount: 1800,
                deliveryStatus: DeliveryStatus.Accepted,
                deliveryEvents: [] as Array<Record<string, unknown>>,
                save: vi.fn().mockResolvedValue(undefined),
            };
            vendorOrdersRepo.findById.mockResolvedValue(doc);

            const result = await service.updateDelivery('vo1', DeliveryStatus.InTransit, 'в пути');

            expect(doc.deliveryStatus).toBe(DeliveryStatus.InTransit);
            expect(doc.deliveryEvents).toHaveLength(1);
            expect(doc.deliveryEvents[0]).toMatchObject({
                status: DeliveryStatus.InTransit,
                note: 'в пути',
            });
            expect(doc.save).toHaveBeenCalled();
            expect(result.deliveryStatus).toBe(DeliveryStatus.InTransit);
        });

        it('бросает NotFound, если саб-заказа нет', async () => {
            vendorOrdersRepo.findById.mockResolvedValue(null);
            await expect(
                service.updateDelivery('voX', DeliveryStatus.Picked),
            ).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('listOrders', () => {
        it('возвращает постраничный список', async () => {
            ordersRepo.findByBuyer.mockResolvedValue({
                data: [
                    {
                        id: 'order1',
                        _id: { toString: () => 'order1' },
                        orderNumber: 'BH-X',
                        buyerId: 'b1',
                        status: OrderStatus.Created,
                        subtotal: 2500,
                        productDiscountTotal: 100,
                        loyaltyDiscount: 0,
                        total: 2400,
                        currencyShown: 'AMD',
                        deliveryAddressSnapshot: checkoutDto.deliveryAddress,
                    },
                ],
                meta: {
                    page: 1,
                    pageSize: 20,
                    total: 1,
                    totalPages: 1,
                    hasNext: false,
                    hasPrev: false,
                },
            });
            const query = { page: 1, pageSize: 20 } as OrdersQueryDto;

            const result = await service.listOrders('b1', query);

            expect(result.data).toHaveLength(1);
            expect(result.data[0]?.total).toBe(2400);
        });
    });

    describe('createFromInvoice', () => {
        beforeEach(() => {
            ordersRepo.create.mockImplementation((data: Record<string, unknown>) =>
                Promise.resolve({ id: 'order1', _id: { toString: () => 'order1' }, ...data }),
            );
            vendorOrdersRepo.create.mockImplementation((data: Record<string, unknown>) =>
                Promise.resolve({ id: 'vo1', _id: { toString: () => 'vo1' }, ...data }),
            );
            ordersRepo.updateById.mockResolvedValue(undefined);
        });

        it('считает заказ из инвойса со скидкой и комиссией §11', async () => {
            const result = await service.createFromInvoice({
                invoiceId: 'inv1',
                buyerId: 'b1',
                vendorId: 'v1',
                lineItems: [
                    { title: 'Цемент', qty: 2, price: 1000 },
                    { title: 'Доставка', qty: 1, price: 500 },
                ],
                discount: { type: 'percent', value: 10 },
                currency: 'AMD',
            });

            const orderArg = ordersRepo.create.mock.calls[0]?.[0] as Record<string, number>;
            expect(orderArg['subtotal']).toBe(2500);
            expect(orderArg['total']).toBe(2250); // 2500 − 10%
            expect(orderArg['productDiscountTotal']).toBe(250);

            const voArg = vendorOrdersRepo.create.mock.calls[0]?.[0] as Record<string, number>;
            expect(voArg['subtotal']).toBe(2250);
            expect(voArg['commissionAmount']).toBe(225);
            expect(voArg['payoutAmount']).toBe(2025);

            const payArg = payments.createForOrder.mock.calls[0]?.[0] as {
                amount: number;
                splits: Array<{ amount: number; commissionAmount: number; payoutAmount: number }>;
            };
            expect(payArg.amount).toBe(2250);
            expect(payArg.splits[0]).toMatchObject({
                amount: 2250,
                commissionAmount: 225,
                payoutAmount: 2025,
            });
            expect(result.total).toBe(2250);
            expect(result.paymentId).toBe('pay1');
            expect(result.orderNumber).toBeTruthy();
        });

        it('без скидки и без адреса — total=subtotal, дефолтный адрес', async () => {
            const result = await service.createFromInvoice({
                invoiceId: 'inv2',
                buyerId: 'b1',
                vendorId: 'v1',
                lineItems: [{ title: 'Кирпич', qty: 10, price: 100 }],
                currency: 'AMD',
            });

            const orderArg = ordersRepo.create.mock.calls[0]?.[0] as Record<string, unknown>;
            expect(orderArg['subtotal']).toBe(1000);
            expect(orderArg['total']).toBe(1000);
            expect(orderArg['productDiscountTotal']).toBe(0);
            expect((orderArg['deliveryAddressSnapshot'] as { label: string }).label).toBe(
                'Invoice',
            );
            expect(result.total).toBe(1000);
        });
    });

    describe('OrdersAnalyticsContract', () => {
        const from = new Date('2026-06-01T00:00:00.000Z');
        const to = new Date('2026-06-30T23:59:59.999Z');

        describe('vendorSummary', () => {
            it('маппит строку агрегата и считает avgCheck=gmv/orders; период в $match', async () => {
                vendorOrdersRepo.aggregate.mockResolvedValue([{ gmv: 1000, orders: 4 }]);

                const summary = await service.vendorSummary('v1', from, to);

                expect(summary).toEqual({ gmv: 1000, orders: 4, avgCheck: 250 });
                const pipeline = vendorOrdersRepo.aggregate.mock.calls[0]?.[0] as Record<
                    string,
                    unknown
                >[];
                expect(pipeline[0]).toEqual({
                    $match: { vendorId: 'v1', createdAt: { $gte: from, $lte: to } },
                });
            });

            it('пустой агрегат → нули и avgCheck=0 (без деления на ноль)', async () => {
                vendorOrdersRepo.aggregate.mockResolvedValue([]);

                const summary = await service.vendorSummary('v1', from, to);

                expect(summary).toEqual({ gmv: 0, orders: 0, avgCheck: 0 });
            });
        });

        describe('revenueSeries', () => {
            it('маппит {_id,gmv,orders} в {date,gmv,orders}; период в $match', async () => {
                vendorOrdersRepo.aggregate.mockResolvedValue([
                    { _id: '2026-06-01', gmv: 500, orders: 2 },
                    { _id: '2026-06-02', gmv: 300, orders: 1 },
                ]);

                const series = await service.revenueSeries('v1', from, to);

                expect(series).toEqual([
                    { date: '2026-06-01', gmv: 500, orders: 2 },
                    { date: '2026-06-02', gmv: 300, orders: 1 },
                ]);
                const pipeline = vendorOrdersRepo.aggregate.mock.calls[0]?.[0] as Record<
                    string,
                    unknown
                >[];
                expect(pipeline[0]).toEqual({
                    $match: { vendorId: 'v1', createdAt: { $gte: from, $lte: to } },
                });
            });
        });

        describe('statusFunnel', () => {
            it('маппит {_id,count} в {status,count}; $match только по vendorId', async () => {
                vendorOrdersRepo.aggregate.mockResolvedValue([
                    { _id: 'accepted', count: 3 },
                    { _id: 'delivered', count: 5 },
                ]);

                const funnel = await service.statusFunnel('v1');

                expect(funnel).toEqual([
                    { status: 'accepted', count: 3 },
                    { status: 'delivered', count: 5 },
                ]);
                const pipeline = vendorOrdersRepo.aggregate.mock.calls[0]?.[0] as Record<
                    string,
                    unknown
                >[];
                expect(pipeline[0]).toEqual({ $match: { vendorId: 'v1' } });
            });
        });

        describe('topProducts', () => {
            it('маппит {_id,qty,revenue} в {productId,qty,revenue}; $limit в пайплайне', async () => {
                vendorOrdersRepo.aggregate.mockResolvedValue([
                    { _id: 'p1', qty: 10, revenue: 1000 },
                    { _id: 'p2', qty: 4, revenue: 200 },
                ]);

                const top = await service.topProducts('v1', 5);

                expect(top).toEqual([
                    { productId: 'p1', qty: 10, revenue: 1000 },
                    { productId: 'p2', qty: 4, revenue: 200 },
                ]);
                const pipeline = vendorOrdersRepo.aggregate.mock.calls[0]?.[0] as Record<
                    string,
                    unknown
                >[];
                expect(pipeline).toContainEqual({ $match: { vendorId: 'v1' } });
                expect(pipeline).toContainEqual({ $limit: 5 });
            });
        });

        describe('platformSummary', () => {
            it('агрегирует GMV/выручку платформы(=комиссии)/заказы по всем вендорам', async () => {
                vendorOrdersRepo.aggregate.mockResolvedValue([
                    { gmv: 10000, platformRevenue: 750, orders: 5 },
                ]);
                const from = new Date('2026-01-01');
                const to = new Date('2026-12-31');

                const summary = await service.platformSummary(from, to);

                expect(summary).toEqual({ gmv: 10000, platformRevenue: 750, orders: 5 });
                const pipeline = vendorOrdersRepo.aggregate.mock.calls[0]?.[0] as Record<
                    string,
                    unknown
                >[];
                expect(pipeline[0]).toEqual({ $match: { createdAt: { $gte: from, $lte: to } } });
            });

            it('пустой результат → нули', async () => {
                vendorOrdersRepo.aggregate.mockResolvedValue([]);
                const summary = await service.platformSummary(new Date(), new Date());
                expect(summary).toEqual({ gmv: 0, platformRevenue: 0, orders: 0 });
            });
        });
    });

    describe('эффективная комиссия из настроек платформы (§17)', () => {
        it('override из PlatformSettings применяется к расчёту заказа', async () => {
            cartsRepo.findByBuyer.mockResolvedValue(makeCart());
            ordersRepo.create.mockImplementation((d: Record<string, unknown>) =>
                Promise.resolve({ id: 'o1', _id: { toString: () => 'o1' }, ...d }),
            );
            ordersRepo.updateById.mockResolvedValue({
                id: 'o1',
                _id: { toString: () => 'o1' },
                buyerId: 'b1',
                status: OrderStatus.Created,
                subtotal: 2500,
                productDiscountTotal: 100,
                loyaltyDiscount: 0,
                total: 2400,
                currencyShown: 'AMD',
                deliveryAddressSnapshot: checkoutDto.deliveryAddress,
            });
            vendorOrdersRepo.create.mockImplementation((d: Record<string, unknown>) =>
                Promise.resolve({
                    id: 'vo',
                    _id: { toString: () => 'vo' },
                    deliveryStatus: DeliveryStatus.Accepted,
                    deliveryEvents: [],
                    ...d,
                }),
            );
            const platformSettings = { getCommissionPercent: vi.fn().mockResolvedValue(20) };
            const svc = new OrdersService(
                cartsRepo as unknown as CartsRepository,
                ordersRepo as unknown as OrdersRepository,
                vendorOrdersRepo as unknown as VendorOrdersRepository,
                deliveryRepo as unknown as DeliveryAddressesRepository,
                catalog as unknown as CatalogServiceContract,
                payments as unknown as PaymentsServiceContract,
                loyalty as unknown as LoyaltyServiceContract,
                { marketplace: { commissionPercent: 10, baseCurrency: 'AMD' } } as never,
                platformSettings as never,
            );

            await svc.checkout('b1', checkoutDto);

            // v1 (subtotal 2000): комиссия 20% = 400 (а не 10%/200 из конфига)
            const v1 = vendorOrdersRepo.create.mock.calls
                .map((c) => c[0] as Record<string, number | string>)
                .find((c) => c['vendorId'] === 'v1');
            expect(v1).toMatchObject({ commissionPercentSnapshot: 20, commissionAmount: 400 });
        });
    });

    describe('listVendorOrders (§14)', () => {
        it('возвращает саб-заказы вендора', async () => {
            vendorOrdersRepo.findByVendor.mockResolvedValue([
                {
                    id: 'vo1',
                    _id: { toString: () => 'vo1' },
                    orderId: 'order1',
                    vendorId: 'v1',
                    items: [],
                    subtotal: 2000,
                    commissionPercentSnapshot: 10,
                    commissionAmount: 200,
                    payoutAmount: 1800,
                    deliveryStatus: DeliveryStatus.Accepted,
                    deliveryEvents: [],
                },
            ]);

            const result = await service.listVendorOrders('v1');

            expect(vendorOrdersRepo.findByVendor).toHaveBeenCalledWith('v1');
            expect(result).toHaveLength(1);
            expect(result[0]?.vendorId).toBe('v1');
        });
    });
});
