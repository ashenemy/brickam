import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { ButtonComponent, InputComponent, SelectComponent } from '@brickam/ui-kit';
import type { ProductListItem } from '../products/models';
import { ProductsApiService } from '../products/products-api.service';
import { VendorsApiService } from '../vendors/vendors-api.service';
import { BulkApiService } from './bulk-api.service';
import type { BulkApplyResult, BulkOp, BulkPreviewResult } from './models';

/** Тип операции (kind). */
type OpKind = 'price' | 'discountSet' | 'discountRemove' | 'stock' | 'status' | 'category';

/**
 * Массовые операции: чекбоксы по товарам вендора, выбор операции,
 * «Превью» → таблица до/после, «Применить» → результат (sync|queued).
 */
@Component({
    selector: 'app-bulk',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonComponent, InputComponent, SelectComponent],
    template: `
        <section class="flex flex-col gap-8">
            <h1 class="text-text-primary" style="font: var(--type-display)">
                {{ t('vendor.bulk.title') }}
            </h1>

            @if (error()) {
                <p class="text-danger" role="alert">{{ error() }}</p>
            }

            <div class="flex flex-col gap-2">
                @for (p of products(); track p.id) {
                    <label class="flex items-center gap-3 text-text-primary">
                        <input
                            type="checkbox"
                            [checked]="isSelected(p.id)"
                            (change)="toggle(p.id)"
                        />
                        <span>{{ p.title.ru || p.title.en || p.title.hy }}</span>
                        <span class="text-text-secondary">· {{ p.price }} AMD · {{ p.stock }}</span>
                    </label>
                }
            </div>

            <p class="text-text-secondary">
                {{ t('vendor.bulk.selected') }}: {{ selectedIds().length }}
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <bh-select
                    [label]="t('vendor.bulk.op')"
                    [options]="opOptions()"
                    [value]="opKind()"
                    (changed)="onOpKind($event)"
                />
                @if (opKind() === 'price' || opKind() === 'stock') {
                    <bh-select
                        [label]="t('vendor.bulk.mode')"
                        [options]="modeOptions()"
                        [value]="mode()"
                        (changed)="mode.set($event)"
                    />
                    <bh-input
                        type="number"
                        [label]="t('vendor.bulk.value')"
                        [value]="value()"
                        (changed)="value.set($event)"
                    />
                }
                @if (opKind() === 'discountSet') {
                    <bh-input
                        type="number"
                        [label]="t('vendor.bulk.value')"
                        [value]="value()"
                        (changed)="value.set($event)"
                    />
                }
                @if (opKind() === 'status') {
                    <bh-select
                        [label]="t('vendor.bulk.op.status')"
                        [options]="statusOptions()"
                        [value]="statusValue()"
                        (changed)="statusValue.set($event)"
                    />
                }
                @if (opKind() === 'category') {
                    <bh-input
                        [label]="t('vendor.bulk.op.category')"
                        [value]="categoryId()"
                        (changed)="categoryId.set($event)"
                    />
                }
            </div>

            <div class="flex flex-wrap items-center gap-3">
                <bh-button
                    variant="secondary"
                    [disabled]="loading() || selectedIds().length === 0"
                    (clicked)="preview()"
                >
                    {{ loading() ? t('vendor.bulk.previewing') : t('vendor.bulk.preview') }}
                </bh-button>
                @if (previewResult()) {
                    <bh-button variant="primary" [disabled]="applying()" (clicked)="apply()">
                        {{ applying() ? t('vendor.bulk.applying') : t('vendor.bulk.apply') }}
                    </bh-button>
                }
            </div>

            @if (selectedIds().length === 0) {
                <p class="text-text-secondary">{{ t('vendor.bulk.noSelection') }}</p>
            }

            @if (applyResult(); as r) {
                <p class="text-success">
                    {{ t('vendor.bulk.applied') }} ·
                    {{ r.mode === 'sync' ? t('vendor.bulk.mode.sync') : t('vendor.bulk.mode.queued') }}
                </p>
            }

            @if (previewResult(); as pr) {
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-text-primary" data-testid="preview-table">
                        <thead class="text-text-secondary" style="font: var(--type-product)">
                            <tr>
                                <th class="py-2 pr-4">{{ t('vendor.bulk.product') }}</th>
                                <th class="py-2 pr-4">{{ t('vendor.bulk.before') }}</th>
                                <th class="py-2">{{ t('vendor.bulk.after') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (row of pr.previews; track row.productId) {
                                <tr class="border-t border-[var(--border-subtle)]">
                                    <td class="py-3 pr-4">
                                        {{ row.title.ru || row.title.en || row.title.hy }}
                                    </td>
                                    <td class="py-3 pr-4">{{ describe(row.before) }}</td>
                                    <td class="py-3">{{ describe(row.after) }}</td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            }
        </section>
    `,
})
export class BulkComponent {
    private readonly api = inject(BulkApiService);
    private readonly productsApi = inject(ProductsApiService);
    private readonly vendorsApi = inject(VendorsApiService);
    private readonly i18n = inject(LanguageService);

    protected readonly products = signal<ProductListItem[]>([]);
    protected readonly selectedIds = signal<string[]>([]);
    protected readonly opKind = signal<OpKind>('price');
    protected readonly mode = signal<string | number>('percent');
    protected readonly value = signal('0');
    protected readonly statusValue = signal<string | number>('active');
    protected readonly categoryId = signal('');

    protected readonly loading = signal(false);
    protected readonly applying = signal(false);
    protected readonly error = signal<string | null>(null);
    protected readonly previewResult = signal<BulkPreviewResult | null>(null);
    protected readonly applyResult = signal<BulkApplyResult | null>(null);

    protected readonly opOptions = computed(() => [
        { label: this.t('vendor.bulk.op.price'), value: 'price' },
        { label: this.t('vendor.bulk.op.discountSet'), value: 'discountSet' },
        { label: this.t('vendor.bulk.op.discountRemove'), value: 'discountRemove' },
        { label: this.t('vendor.bulk.op.stock'), value: 'stock' },
        { label: this.t('vendor.bulk.op.status'), value: 'status' },
        { label: this.t('vendor.bulk.op.category'), value: 'category' },
    ]);

    protected readonly modeOptions = computed(() => {
        if (this.opKind() === 'stock') {
            return [
                { label: this.t('vendor.bulk.mode.set'), value: 'set' },
                { label: this.t('vendor.bulk.mode.inc'), value: 'inc' },
            ];
        }
        return [
            { label: this.t('vendor.bulk.op.price'), value: 'set' },
            { label: this.t('vendor.bulk.mode.inc'), value: 'percent' },
            { label: this.t('vendor.bulk.mode.dec'), value: 'amount' },
        ];
    });

    protected readonly statusOptions = computed(() => [
        { label: this.t('vendor.products.status.active'), value: 'active' },
        { label: this.t('vendor.products.status.hidden'), value: 'hidden' },
    ]);

    constructor() {
        this.vendorsApi.me().subscribe({
            next: (v) =>
                this.productsApi.list(v.id).subscribe({
                    next: (items) => this.products.set(items),
                    error: (err) => this.error.set(this.errMsg(err)),
                }),
            error: (err) => this.error.set(this.errMsg(err)),
        });
    }

    protected t(key: string): string {
        return this.i18n.t(key);
    }

    protected isSelected(id: string): boolean {
        return this.selectedIds().includes(id);
    }

    protected toggle(id: string): void {
        this.selectedIds.update((ids) =>
            ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
        );
        this.previewResult.set(null);
        this.applyResult.set(null);
    }

    protected onOpKind(value: string | number): void {
        this.opKind.set(value as OpKind);
        this.mode.set(this.opKind() === 'stock' ? 'set' : 'percent');
        this.previewResult.set(null);
        this.applyResult.set(null);
    }

    protected preview(): void {
        if (this.selectedIds().length === 0 || this.loading()) {
            return;
        }
        this.loading.set(true);
        this.error.set(null);
        this.applyResult.set(null);
        this.api.preview(this.selectedIds(), this.buildOp()).subscribe({
            next: (res) => {
                this.previewResult.set(res);
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(this.errMsg(err));
                this.loading.set(false);
            },
        });
    }

    protected apply(): void {
        if (this.selectedIds().length === 0 || this.applying()) {
            return;
        }
        this.applying.set(true);
        this.error.set(null);
        this.api.apply(this.selectedIds(), this.buildOp()).subscribe({
            next: (res) => {
                this.applyResult.set(res);
                this.applying.set(false);
            },
            error: (err) => {
                this.error.set(this.errMsg(err));
                this.applying.set(false);
            },
        });
    }

    /** Краткое текстовое представление полей до/после для таблицы. */
    protected describe(fields: {
        price?: number;
        stock?: number;
        status?: string;
        categoryId?: string;
        discount?: { type: string; value: number } | null;
    }): string {
        const parts: string[] = [];
        if (fields.price !== undefined) parts.push(`${fields.price} AMD`);
        if (fields.stock !== undefined) parts.push(`stock ${fields.stock}`);
        if (fields.status !== undefined) parts.push(String(fields.status));
        if (fields.categoryId !== undefined) parts.push(String(fields.categoryId));
        if (fields.discount === null) parts.push('—');
        else if (fields.discount)
            parts.push(`-${fields.discount.value}${fields.discount.type === 'percent' ? '%' : ''}`);
        return parts.join(' · ') || '—';
    }

    private buildOp(): BulkOp {
        const v = Number.parseFloat(this.value()) || 0;
        switch (this.opKind()) {
            case 'price':
                return {
                    kind: 'price',
                    mode: this.mode() as 'percent' | 'amount' | 'set',
                    value: v,
                };
            case 'stock':
                return { kind: 'stock', mode: this.mode() as 'set' | 'inc', value: v };
            case 'discountSet':
                return { kind: 'discountSet', discount: { type: 'percent', value: v } };
            case 'discountRemove':
                return { kind: 'discountRemove' };
            case 'status':
                return { kind: 'status', status: this.statusValue() as 'active' | 'hidden' };
            case 'category':
                return { kind: 'category', categoryId: this.categoryId().trim() };
        }
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
