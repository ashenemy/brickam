import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { SelectComponent } from '@brickam/ui-kit';
import { type DeliveryStatus, OrdersApiService, type VendorOrder } from './orders-api.service';

/**
 * Список вендорских саб-заказов + смена статуса доставки (селект → PATCH).
 */
@Component({
    selector: 'app-orders',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SelectComponent],
    template: `
        <section class="flex flex-col gap-8">
            <h1 class="text-text-primary" style="font: var(--type-display)">
                {{ t('vendor.orders.title') }}
            </h1>

            @if (error()) {
                <p class="text-danger" role="alert">{{ error() }}</p>
            }

            @if (loading()) {
                <p class="text-text-secondary">{{ t('vendor.common.loading') }}</p>
            } @else if (orders().length === 0) {
                <p class="text-text-secondary">{{ t('vendor.common.empty') }}</p>
            } @else {
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-text-primary">
                        <thead class="text-text-secondary" style="font: var(--type-product)">
                            <tr>
                                <th class="py-2 pr-4">{{ t('vendor.orders.col.id') }}</th>
                                <th class="py-2 pr-4">{{ t('vendor.orders.col.total') }}</th>
                                <th class="py-2">{{ t('vendor.orders.col.status') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (o of orders(); track o.id) {
                                <tr class="border-t border-[var(--border-subtle)]">
                                    <td class="py-3 pr-4">{{ o.orderId }}</td>
                                    <td class="py-3 pr-4">{{ o.subtotal }} AMD</td>
                                    <td class="py-3 w-56">
                                        <bh-select
                                            [options]="statusOptions()"
                                            [value]="o.deliveryStatus"
                                            (changed)="changeStatus(o, $event)"
                                        />
                                    </td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            }
        </section>
    `,
})
export class OrdersComponent {
    private readonly api = inject(OrdersApiService);
    private readonly i18n = inject(LanguageService);

    protected readonly orders = signal<VendorOrder[]>([]);
    protected readonly loading = signal(true);
    protected readonly error = signal<string | null>(null);

    protected readonly statusOptions = computed(() => [
        { label: this.t('vendor.orders.status.pending'), value: 'accepted' },
        { label: this.t('vendor.orders.status.preparing'), value: 'picked' },
        { label: this.t('vendor.orders.status.shipped'), value: 'in_transit' },
        { label: this.t('vendor.orders.status.delivered'), value: 'delivered' },
        { label: this.t('vendor.orders.status.cancelled'), value: 'cancelled' },
    ]);

    constructor() {
        this.api.list().subscribe({
            next: (items) => {
                this.orders.set(items);
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(this.errMsg(err));
                this.loading.set(false);
            },
        });
    }

    protected t(key: string): string {
        return this.i18n.t(key);
    }

    protected changeStatus(order: VendorOrder, value: string | number): void {
        const status = value as DeliveryStatus;
        this.api.updateDelivery(order.id, status).subscribe({
            next: (updated) =>
                this.orders.update((list) => list.map((o) => (o.id === order.id ? updated : o))),
            error: (err) => this.error.set(this.errMsg(err)),
        });
    }

    private errMsg(err: unknown): string {
        if (err && typeof err === 'object' && 'error' in err) {
            const body = (err as { error?: { message?: string } }).error;
            if (body?.message) {
                return body.message;
            }
        }
        return this.t('vendor.common.error');
    }
}
