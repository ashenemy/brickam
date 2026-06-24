import { DeliveryStatus, type LocalizedText, OrderStatus } from '@brickam/domain-kit';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
    CartContract,
    CartItemContract,
    DeliveryAddressSnapshot,
    OrderContract,
    VendorOrderContract,
    VendorOrderItemContract,
} from '../../@types';

/** Swagger-модель позиции корзины. */
export class CartItemDto implements CartItemContract {
    @ApiProperty() productId!: string;
    @ApiProperty() vendorId!: string;
    @ApiProperty() qty!: number;
    @ApiProperty() priceSnapshot!: number;
}

/** Swagger-модель корзины. */
export class CartDto implements CartContract {
    @ApiProperty() buyerId!: string;
    @ApiProperty({ type: [CartItemDto] }) items!: CartItemDto[];
}

/** Swagger-модель снимка адреса доставки. */
export class DeliveryAddressSnapshotDto implements DeliveryAddressSnapshot {
    @ApiProperty() label!: string;
    @ApiProperty() region!: string;
    @ApiProperty() city!: string;
    @ApiProperty() line1!: string;
    @ApiPropertyOptional() line2?: string;
    @ApiProperty() phone!: string;
}

/** Swagger-модель заказа. */
export class OrderDto implements OrderContract {
    @ApiProperty() id!: string;
    @ApiProperty() orderNumber!: string;
    @ApiProperty() buyerId!: string;
    @ApiProperty({ enum: OrderStatus }) status!: OrderStatus;
    @ApiProperty() subtotal!: number;
    @ApiProperty() productDiscountTotal!: number;
    @ApiProperty() loyaltyDiscount!: number;
    @ApiProperty() total!: number;
    @ApiProperty() currencyShown!: string;
    @ApiPropertyOptional() paymentId?: string;
    @ApiProperty({ type: DeliveryAddressSnapshotDto })
    deliveryAddressSnapshot!: DeliveryAddressSnapshot;
}

/** Swagger-модель позиции саб-заказа вендора. */
export class VendorOrderItemDto implements VendorOrderItemContract {
    @ApiProperty() productId!: string;
    @ApiPropertyOptional() titleSnapshot?: LocalizedText;
    @ApiProperty() qty!: number;
    @ApiProperty() unitPrice!: number;
    @ApiProperty() discountApplied!: number;
    @ApiProperty() lineTotal!: number;
}

/** Swagger-модель саб-заказа вендора. */
export class VendorOrderDto implements VendorOrderContract {
    @ApiProperty() id!: string;
    @ApiProperty() orderId!: string;
    @ApiProperty() vendorId!: string;
    @ApiProperty({ type: [VendorOrderItemDto] }) items!: VendorOrderItemDto[];
    @ApiProperty() subtotal!: number;
    @ApiProperty() commissionPercentSnapshot!: number;
    @ApiProperty() commissionAmount!: number;
    @ApiProperty() payoutAmount!: number;
    @ApiProperty({ enum: DeliveryStatus }) deliveryStatus!: DeliveryStatus;
    @ApiProperty() deliveryEvents!: VendorOrderContract['deliveryEvents'];
}
