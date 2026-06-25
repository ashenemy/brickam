import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { BadgeComponent, ButtonComponent, InputComponent, SelectComponent } from '@brickam/ui-kit';
import { VendorsApiService } from '../vendors/vendors-api.service';
import type { CreateProductPayload, MediaType, ProductListItem, ProductStatus } from './models';
import { ProductsApiService } from './products-api.service';

/** Поля формы товара (значения как строки из инпутов). */
type ProductForm = {
    id: string | null;
    titleRu: string;
    titleHy: string;
    titleEn: string;
    descRu: string;
    descHy: string;
    descEn: string;
    price: string;
    discount: string;
    stock: string;
    categoryId: string;
    status: ProductStatus;
    mediaUrl: string;
    mediaType: MediaType;
};

function emptyForm(): ProductForm {
    return {
        id: null,
        titleRu: '',
        titleHy: '',
        titleEn: '',
        descRu: '',
        descHy: '',
        descEn: '',
        price: '0',
        discount: '0',
        stock: '0',
        categoryId: '',
        status: 'active',
        mediaUrl: '',
        mediaType: 'image',
    };
}

/**
 * Список товаров вендора + инлайн-форма создания/редактирования.
 * vendorId резолвится из GET /vendors/me. Скрытие/показ и удаление — через API.
 */
@Component({
    selector: 'app-products',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonComponent, InputComponent, SelectComponent, BadgeComponent],
    template: `
        <section class="flex flex-col gap-8">
            <div class="flex flex-wrap items-center justify-between gap-3">
                <h1 class="text-text-primary" style="font: var(--type-display)">
                    {{ t('vendor.products.title') }}
                </h1>
                <bh-button variant="primary" (clicked)="startCreate()">
                    {{ t('vendor.products.new') }}
                </bh-button>
            </div>

            @if (error()) {
                <p class="text-danger" role="alert">{{ error() }}</p>
            }

            @if (form(); as f) {
                <div class="flex flex-col gap-4 rounded-md p-5 bg-surface-card">
                    <h2 class="text-text-primary" style="font: var(--type-heading)">
                        {{ f.id ? t('vendor.products.editTitle') : t('vendor.products.createTitle') }}
                    </h2>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <bh-input
                            [label]="t('vendor.products.field.titleRu')"
                            [value]="f.titleRu"
                            (changed)="set('titleRu', $event)"
                        />
                        <bh-input
                            [label]="t('vendor.products.field.titleHy')"
                            [value]="f.titleHy"
                            (changed)="set('titleHy', $event)"
                        />
                        <bh-input
                            [label]="t('vendor.products.field.titleEn')"
                            [value]="f.titleEn"
                            (changed)="set('titleEn', $event)"
                        />
                        <bh-input
                            [label]="t('vendor.products.field.descRu')"
                            [value]="f.descRu"
                            (changed)="set('descRu', $event)"
                        />
                        <bh-input
                            [label]="t('vendor.products.field.descHy')"
                            [value]="f.descHy"
                            (changed)="set('descHy', $event)"
                        />
                        <bh-input
                            [label]="t('vendor.products.field.descEn')"
                            [value]="f.descEn"
                            (changed)="set('descEn', $event)"
                        />
                        <bh-input
                            type="number"
                            [label]="t('vendor.products.field.price')"
                            [value]="f.price"
                            (changed)="set('price', $event)"
                        />
                        <bh-input
                            type="number"
                            [label]="t('vendor.products.field.discount')"
                            [value]="f.discount"
                            (changed)="set('discount', $event)"
                        />
                        <bh-input
                            type="number"
                            [label]="t('vendor.products.field.stock')"
                            [value]="f.stock"
                            (changed)="set('stock', $event)"
                        />
                        <bh-input
                            [label]="t('vendor.products.field.category')"
                            [value]="f.categoryId"
                            (changed)="set('categoryId', $event)"
                        />
                        <bh-select
                            [label]="t('vendor.products.field.status')"
                            [options]="statusOptions()"
                            [value]="f.status"
                            (changed)="set('status', $event)"
                        />
                        <bh-select
                            [label]="t('vendor.products.field.mediaType')"
                            [options]="mediaOptions()"
                            [value]="f.mediaType"
                            (changed)="set('mediaType', $event)"
                        />
                        <bh-input
                            class="sm:col-span-2"
                            [label]="t('vendor.products.field.mediaUrl')"
                            [value]="f.mediaUrl"
                            (changed)="set('mediaUrl', $event)"
                        />
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                        <bh-button
                            variant="primary"
                            [disabled]="saving() || !canSave()"
                            (clicked)="save()"
                        >
                            {{ saving() ? t('vendor.common.saving') : t('vendor.common.save') }}
                        </bh-button>
                        <bh-button variant="ghost" (clicked)="cancel()">
                            {{ t('vendor.common.cancel') }}
                        </bh-button>
                    </div>
                </div>
            }

            @if (loading()) {
                <p class="text-text-secondary">{{ t('vendor.common.loading') }}</p>
            } @else if (products().length === 0) {
                <p class="text-text-secondary">{{ t('vendor.common.empty') }}</p>
            } @else {
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-text-primary">
                        <thead class="text-text-secondary" style="font: var(--type-product)">
                            <tr>
                                <th class="py-2 pr-4">{{ t('vendor.products.col.title') }}</th>
                                <th class="py-2 pr-4">{{ t('vendor.products.col.price') }}</th>
                                <th class="py-2 pr-4">{{ t('vendor.products.col.stock') }}</th>
                                <th class="py-2 pr-4">{{ t('vendor.products.col.status') }}</th>
                                <th class="py-2">{{ t('vendor.products.col.actions') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (p of products(); track p.id) {
                                <tr class="border-t border-[var(--border-subtle)]">
                                    <td class="py-3 pr-4">{{ p.title.ru || p.title.en || p.title.hy }}</td>
                                    <td class="py-3 pr-4">{{ p.finalPrice }} AMD</td>
                                    <td class="py-3 pr-4">{{ p.stock }}</td>
                                    <td class="py-3 pr-4">
                                        <bh-badge [tone]="p.stock > 0 ? 'success' : 'danger'">
                                            {{ p.stock > 0 ? t('vendor.products.status.active') : t('vendor.products.status.hidden') }}
                                        </bh-badge>
                                    </td>
                                    <td class="py-3">
                                        <div class="flex flex-wrap gap-2">
                                            <bh-button size="sm" variant="secondary" (clicked)="startEdit(p)">
                                                {{ t('vendor.common.edit') }}
                                            </bh-button>
                                            <bh-button size="sm" variant="ghost" (clicked)="hide(p)">
                                                {{ t('vendor.products.action.hide') }}
                                            </bh-button>
                                            <bh-button size="sm" variant="danger" (clicked)="remove(p)">
                                                {{ t('vendor.common.delete') }}
                                            </bh-button>
                                        </div>
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
export class ProductsComponent {
    private readonly api = inject(ProductsApiService);
    private readonly vendorsApi = inject(VendorsApiService);
    private readonly i18n = inject(LanguageService);

    protected readonly products = signal<ProductListItem[]>([]);
    protected readonly loading = signal(true);
    protected readonly saving = signal(false);
    protected readonly error = signal<string | null>(null);
    protected readonly form = signal<ProductForm | null>(null);
    private readonly vendorId = signal('');

    protected readonly statusOptions = computed(() => [
        { label: this.t('vendor.products.status.active'), value: 'active' },
        { label: this.t('vendor.products.status.hidden'), value: 'hidden' },
        { label: this.t('vendor.products.status.draft'), value: 'draft' },
    ]);

    protected readonly mediaOptions = computed(() => [
        { label: this.t('vendor.products.media.image'), value: 'image' },
        { label: this.t('vendor.products.media.video'), value: 'video' },
    ]);

    protected readonly canSave = computed(() => {
        const f = this.form();
        return !!f && f.titleRu.trim().length > 0 && this.num(f.price) >= 0;
    });

    constructor() {
        this.vendorsApi.me().subscribe({
            next: (v) => {
                this.vendorId.set(v.id);
                this.reload();
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

    protected set(key: keyof ProductForm, value: string | number): void {
        this.form.update((f) => (f ? { ...f, [key]: value } : f));
    }

    protected startCreate(): void {
        this.form.set(emptyForm());
    }

    protected startEdit(p: ProductListItem): void {
        this.form.set({
            id: p.id,
            titleRu: p.title.ru,
            titleHy: p.title.hy,
            titleEn: p.title.en,
            descRu: '',
            descHy: '',
            descEn: '',
            price: String(p.price),
            discount: p.discount ? String(p.discount.value) : '0',
            stock: String(p.stock),
            categoryId: p.categoryId,
            status: 'active',
            mediaUrl: p.cover?.url ?? '',
            mediaType: p.cover?.mediaType ?? 'image',
        });
    }

    protected cancel(): void {
        this.form.set(null);
    }

    protected save(): void {
        const f = this.form();
        if (!f || !this.canSave() || this.saving()) {
            return;
        }
        this.saving.set(true);
        this.error.set(null);
        const discount = this.num(f.discount);
        const payload: CreateProductPayload = {
            vendorId: this.vendorId(),
            categoryId: f.categoryId.trim() || 'uncategorized',
            slug: f.id ?? this.slugify(f.titleEn || f.titleRu),
            title: { ru: f.titleRu.trim(), hy: f.titleHy.trim(), en: f.titleEn.trim() },
            description: { ru: f.descRu.trim(), hy: f.descHy.trim(), en: f.descEn.trim() },
            cover: { mediaType: f.mediaType, url: f.mediaUrl.trim() },
            price: this.num(f.price),
            unit: 'pcs',
            stock: this.num(f.stock),
            region: 'Yerevan',
        };
        if (discount > 0) {
            payload.discount = { type: 'percent', value: discount };
        }
        const req = f.id
            ? this.api.update(f.id, { ...payload, status: f.status })
            : this.api.create(payload);
        req.subscribe({
            next: () => {
                this.saving.set(false);
                this.form.set(null);
                this.reload();
            },
            error: (err) => {
                this.error.set(this.errMsg(err));
                this.saving.set(false);
            },
        });
    }

    protected hide(p: ProductListItem): void {
        this.api.hide(p.id).subscribe({
            next: () => this.reload(),
            error: (err) => this.error.set(this.errMsg(err)),
        });
    }

    protected remove(p: ProductListItem): void {
        this.api.remove(p.id).subscribe({
            next: () => this.products.update((list) => list.filter((x) => x.id !== p.id)),
            error: (err) => this.error.set(this.errMsg(err)),
        });
    }

    private reload(): void {
        this.loading.set(true);
        this.api.list(this.vendorId()).subscribe({
            next: (items) => {
                this.products.set(items);
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(this.errMsg(err));
                this.loading.set(false);
            },
        });
    }

    private slugify(value: string): string {
        return (
            value
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '') || `product-${Date.now()}`
        );
    }

    private num(value: string): number {
        const n = Number.parseFloat(value);
        return Number.isFinite(n) ? n : 0;
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
