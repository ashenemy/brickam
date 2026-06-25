import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { ButtonComponent, InputComponent, SelectComponent } from '@brickam/ui-kit';
import { InvoicesApiService } from './invoices-api.service';
import type { CreateInvoicePayload, DiscountType, Invoice, InvoiceLineItem } from './models';

/** Редактируемая позиция формы (значения как строки из инпутов). */
type LineRow = {
    title: string;
    qty: string;
    price: string;
};

/**
 * Форма создания инвойса продавцом: позиции, скидка, срок действия.
 * Живой подсчёт subtotal/total. После создания — отправка в чат и ссылка на PDF.
 */
@Component({
    selector: 'app-invoice-create',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [InputComponent, SelectComponent, ButtonComponent],
    template: `
        <section class="flex flex-col gap-8 max-w-3xl">
            <h1 class="text-text-primary" style="font: var(--type-display)">{{ t('invoice.create.title') }}</h1>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <bh-input
                    [label]="t('invoice.field.chatId')"
                    [value]="chatId()"
                    (changed)="chatId.set($event)"
                />
                <bh-input
                    [label]="t('invoice.field.buyerId')"
                    [value]="buyerId()"
                    (changed)="buyerId.set($event)"
                />
            </div>

            <div class="flex flex-col gap-4">
                <h2 class="text-text-primary" style="font: var(--type-heading)">{{ t('invoice.field.lineItems') }}</h2>
                @for (row of lineItems(); track $index) {
                    <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div class="sm:col-span-6">
                            <bh-input
                                [label]="t('invoice.field.itemTitle')"
                                [value]="row.title"
                                (changed)="updateRow($index, 'title', $event)"
                            />
                        </div>
                        <div class="sm:col-span-2">
                            <bh-input
                                type="number"
                                [label]="t('invoice.field.qty')"
                                [value]="row.qty"
                                (changed)="updateRow($index, 'qty', $event)"
                            />
                        </div>
                        <div class="sm:col-span-3">
                            <bh-input
                                type="number"
                                [label]="t('invoice.field.price')"
                                [value]="row.price"
                                (changed)="updateRow($index, 'price', $event)"
                            />
                        </div>
                        <div class="sm:col-span-1">
                            <bh-button
                                variant="danger"
                                [disabled]="lineItems().length <= 1"
                                (clicked)="removeRow($index)"
                            >
                                ✕
                            </bh-button>
                        </div>
                    </div>
                }
                <div>
                    <bh-button variant="secondary" (clicked)="addRow()">
                        {{ t('invoice.action.addItem') }}
                    </bh-button>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <bh-select
                    [label]="t('invoice.field.discountType')"
                    [options]="discountOptions()"
                    [value]="discountType()"
                    (changed)="onDiscountType($event)"
                />
                <bh-input
                    type="number"
                    [label]="t('invoice.field.discountValue')"
                    [value]="discountValue()"
                    (changed)="discountValue.set($event)"
                />
                <bh-input
                    type="date"
                    [label]="t('invoice.field.validUntil')"
                    [value]="validUntil()"
                    (changed)="validUntil.set($event)"
                />
            </div>

            <div class="flex flex-col gap-1 rounded-md p-5 bg-surface-card">
                <div class="flex justify-between text-text-secondary">
                    <span>{{ t('invoice.summary.subtotal') }}</span>
                    <span>{{ subtotal() }} AMD</span>
                </div>
                <div class="flex justify-between text-text-primary" style="font: var(--type-heading)">
                    <span>{{ t('invoice.summary.total') }}</span>
                    <span>{{ total() }} AMD</span>
                </div>
            </div>

            @if (error()) {
                <p class="text-danger" role="alert">{{ error() }}</p>
            }

            @if (!created()) {
                <div>
                    <bh-button
                        variant="primary"
                        [disabled]="loading() || !canCreate()"
                        (clicked)="create()"
                    >
                        {{ loading() ? t('invoice.action.creating') : t('invoice.action.create') }}
                    </bh-button>
                </div>
            } @else {
                <div class="flex flex-col gap-4 rounded-md p-5 bg-surface-card">
                    <p class="text-success">
                        {{ t('invoice.success.created') }} № {{ created()?.invoiceNumber }}
                    </p>
                    <div class="flex flex-wrap items-center gap-3">
                        @if (created()?.status !== 'sent') {
                            <bh-button
                                variant="primary"
                                [disabled]="sending()"
                                (clicked)="send()"
                            >
                                {{ sending() ? t('invoice.action.sending') : t('invoice.action.send') }}
                            </bh-button>
                        } @else {
                            <bh-button variant="secondary" [disabled]="true">
                                {{ t('invoice.success.sent') }}
                            </bh-button>
                        }
                        <a [href]="pdfHref()" target="_blank" rel="noopener">
                            <bh-button variant="ghost">{{ t('invoice.action.openPdf') }}</bh-button>
                        </a>
                    </div>
                </div>
            }
        </section>
    `,
})
export class InvoiceCreateComponent {
    private readonly api = inject(InvoicesApiService);
    private readonly i18n = inject(LanguageService);

    protected readonly chatId = signal('');
    protected readonly buyerId = signal('');
    protected readonly lineItems = signal<LineRow[]>([{ title: '', qty: '1', price: '0' }]);
    protected readonly discountType = signal<DiscountType>('percent');
    protected readonly discountValue = signal('0');
    protected readonly validUntil = signal('');

    protected readonly loading = signal(false);
    protected readonly sending = signal(false);
    protected readonly error = signal<string | null>(null);
    protected readonly created = signal<Invoice | null>(null);

    protected readonly discountOptions = computed(() => [
        { label: this.t('invoice.discount.percent'), value: 'percent' },
        { label: this.t('invoice.discount.amount'), value: 'amount' },
    ]);

    /** subtotal = Σ qty*price, целые AMD. */
    protected readonly subtotal = computed(() =>
        Math.round(
            this.lineItems().reduce((sum, r) => sum + this.num(r.qty) * this.num(r.price), 0),
        ),
    );

    /** total = subtotal минус скидка (percent или amount), не ниже нуля, целые AMD. */
    protected readonly total = computed(() => {
        const sub = this.subtotal();
        const value = this.num(this.discountValue());
        const cut = this.discountType() === 'percent' ? (sub * value) / 100 : value;
        return Math.max(0, Math.round(sub - cut));
    });

    protected readonly canCreate = computed(
        () =>
            this.chatId().trim().length > 0 &&
            this.buyerId().trim().length > 0 &&
            this.validUntil().length > 0 &&
            this.lineItems().some((r) => r.title.trim().length > 0 && this.num(r.qty) > 0),
    );

    protected readonly pdfHref = computed(() => {
        const inv = this.created();
        return inv ? this.api.pdfUrl(inv.id) : '#';
    });

    protected t(key: string): string {
        return this.i18n.t(key);
    }

    protected addRow(): void {
        this.lineItems.update((rows) => [...rows, { title: '', qty: '1', price: '0' }]);
    }

    protected removeRow(index: number): void {
        this.lineItems.update((rows) => rows.filter((_, i) => i !== index));
    }

    protected updateRow(index: number, key: keyof LineRow, value: string): void {
        this.lineItems.update((rows) =>
            rows.map((r, i) => (i === index ? { ...r, [key]: value } : r)),
        );
    }

    protected onDiscountType(value: string | number): void {
        this.discountType.set(value as DiscountType);
    }

    protected create(): void {
        if (!this.canCreate() || this.loading()) {
            return;
        }
        this.loading.set(true);
        this.error.set(null);
        this.api.create(this.buildPayload()).subscribe({
            next: (inv) => {
                this.created.set(inv);
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(this.errorMessage(err));
                this.loading.set(false);
            },
        });
    }

    protected send(): void {
        const inv = this.created();
        if (!inv || this.sending()) {
            return;
        }
        this.sending.set(true);
        this.error.set(null);
        this.api.send(inv.id).subscribe({
            next: (updated) => {
                this.created.set(updated);
                this.sending.set(false);
            },
            error: (err) => {
                this.error.set(this.errorMessage(err));
                this.sending.set(false);
            },
        });
    }

    private buildPayload(): CreateInvoicePayload {
        const items: InvoiceLineItem[] = this.lineItems()
            .filter((r) => r.title.trim().length > 0)
            .map((r) => ({
                title: r.title.trim(),
                qty: this.num(r.qty),
                price: this.num(r.price),
            }));
        const value = this.num(this.discountValue());
        const payload: CreateInvoicePayload = {
            chatId: this.chatId().trim(),
            buyerId: this.buyerId().trim(),
            lineItems: items,
            validUntil: this.validUntil(),
        };
        if (value > 0) {
            payload.discount = { type: this.discountType(), value };
        }
        return payload;
    }

    private num(value: string): number {
        const n = Number.parseFloat(value);
        return Number.isFinite(n) ? n : 0;
    }

    private errorMessage(err: unknown): string {
        const fallback = this.t('invoice.error.generic');
        if (err && typeof err === 'object' && 'error' in err) {
            const body = (err as { error?: { message?: string } }).error;
            if (body?.message) {
                return body.message;
            }
        }
        return fallback;
    }
}
