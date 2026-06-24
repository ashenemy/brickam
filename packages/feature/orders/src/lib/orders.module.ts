import { OrdersServiceContract } from '@brickam/domain-kit';
import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartController } from './cart.controller';
import { Cart, CartSchema } from './cart.schema';
import { CartService } from './cart.service';
import { CartsRepository } from './carts.repository';
import { DeliveryAddress, DeliveryAddressSchema } from './delivery-address.schema';
import { DeliveryAddressesRepository } from './delivery-addresses.repository';
import { Order, OrderSchema } from './order.schema';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';
import { VendorOrder, VendorOrderSchema } from './vendor-order.schema';
import { VendorOrdersRepository } from './vendor-orders.repository';

/**
 * Модуль заказов (Foundations §11/§15). Корзина → checkout → заказ + саб-заказы
 * вендоров + один платёж со splits. Каталог и платежи — только по глобальным
 * контрактам CatalogServiceContract/PaymentsServiceContract (граница feature).
 */
@Global()
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Cart.name, schema: CartSchema },
            { name: Order.name, schema: OrderSchema },
            { name: VendorOrder.name, schema: VendorOrderSchema },
            { name: DeliveryAddress.name, schema: DeliveryAddressSchema },
        ]),
    ],
    controllers: [CartController, OrdersController],
    providers: [
        CartsRepository,
        OrdersRepository,
        VendorOrdersRepository,
        DeliveryAddressesRepository,
        CartService,
        OrdersService,
        // Контракт для reviews: проверка завершённого vendor_order покупателя.
        { provide: OrdersServiceContract, useExisting: OrdersService },
    ],
    exports: [CartService, OrdersService, OrdersServiceContract],
})
export class OrdersModule {}
