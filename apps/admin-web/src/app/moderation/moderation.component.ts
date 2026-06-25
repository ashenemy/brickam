import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { BadgeComponent, ButtonComponent } from '@brickam/ui-kit';
import {
    ModerationApiService,
    type ModerationProduct,
    type ModerationVendor,
} from './moderation-api.service';

/**
 * Страница модерации: вендоры и товары на модерации (status=pending),
 * по каждой записи кнопки «Одобрить»/«Отклонить» → PATCH .../moderate.
 */
@Component({
    selector: 'app-moderation',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonComponent, BadgeComponent],
    template: `
        <section class="flex flex-col gap-10">
            <h1 class="text-text-primary" style="font: var(--type-display)">
                {{ t('admin.moderation.title') }}
            </h1>

            @if (error()) {
                <p class="text-danger" role="alert">{{ error() }}</p>
            }

            <div class="flex flex-col gap-4">
                <h2 class="text-text-primary" style="font: var(--type-heading)">
                    {{ t('admin.moderation.vendors') }}
                </h2>
                @if (loading()) {
                    <p class="text-text-secondary">{{ t('admin.common.loading') }}</p>
                } @else if (vendors().length === 0) {
                    <p class="text-text-secondary">{{ t('admin.common.empty') }}</p>
                } @else {
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-text-primary">
                            <thead class="text-text-secondary" style="font: var(--type-product)">
                                <tr>
                                    <th class="py-2 pr-4">{{ t('admin.moderation.col.name') }}</th>
                                    <th class="py-2 pr-4">{{ t('admin.moderation.col.status') }}</th>
                                    <th class="py-2">{{ t('admin.moderation.col.actions') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (v of vendors(); track v.id) {
                                    <tr class="border-t border-[var(--border-subtle)]">
                                        <td class="py-3 pr-4">{{ v.name }}</td>
                                        <td class="py-3 pr-4">
                                            <bh-badge tone="accent">{{ v.status }}</bh-badge>
                                        </td>
                                        <td class="py-3">
                                            <div class="flex flex-wrap gap-2">
                                                <bh-button
                                                    size="sm"
                                                    variant="primary"
                                                    (clicked)="approveVendor(v)"
                                                >
                                                    {{ t('admin.moderation.approve') }}
                                                </bh-button>
                                                <bh-button
                                                    size="sm"
                                                    variant="danger"
                                                    (clicked)="rejectVendor(v)"
                                                >
                                                    {{ t('admin.moderation.reject') }}
                                                </bh-button>
                                            </div>
                                        </td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                }
            </div>

            <div class="flex flex-col gap-4">
                <h2 class="text-text-primary" style="font: var(--type-heading)">
                    {{ t('admin.moderation.products') }}
                </h2>
                @if (loading()) {
                    <p class="text-text-secondary">{{ t('admin.common.loading') }}</p>
                } @else if (products().length === 0) {
                    <p class="text-text-secondary">{{ t('admin.common.empty') }}</p>
                } @else {
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-text-primary">
                            <thead class="text-text-secondary" style="font: var(--type-product)">
                                <tr>
                                    <th class="py-2 pr-4">{{ t('admin.moderation.col.title') }}</th>
                                    <th class="py-2 pr-4">{{ t('admin.moderation.col.status') }}</th>
                                    <th class="py-2">{{ t('admin.moderation.col.actions') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (p of products(); track p.id) {
                                    <tr class="border-t border-[var(--border-subtle)]">
                                        <td class="py-3 pr-4">
                                            {{ p.title.ru || p.title.en || p.title.hy || p.slug }}
                                        </td>
                                        <td class="py-3 pr-4">
                                            <bh-badge tone="accent">{{ p.status }}</bh-badge>
                                        </td>
                                        <td class="py-3">
                                            <div class="flex flex-wrap gap-2">
                                                <bh-button
                                                    size="sm"
                                                    variant="primary"
                                                    (clicked)="approveProduct(p)"
                                                >
                                                    {{ t('admin.moderation.approve') }}
                                                </bh-button>
                                                <bh-button
                                                    size="sm"
                                                    variant="danger"
                                                    (clicked)="rejectProduct(p)"
                                                >
                                                    {{ t('admin.moderation.reject') }}
                                                </bh-button>
                                            </div>
                                        </td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                }
            </div>
        </section>
    `,
})
export class ModerationComponent {
    private readonly api = inject(ModerationApiService);
    private readonly i18n = inject(LanguageService);

    protected readonly vendors = signal<ModerationVendor[]>([]);
    protected readonly products = signal<ModerationProduct[]>([]);
    protected readonly loading = signal(true);
    protected readonly error = signal<string | null>(null);

    constructor() {
        this.reload();
    }

    protected t(key: string): string {
        return this.i18n.t(key);
    }

    protected approveVendor(v: ModerationVendor): void {
        this.api.moderateVendor(v.id, 'approve').subscribe({
            next: () => this.removeVendor(v.id),
            error: (err) => this.error.set(this.errMsg(err)),
        });
    }

    protected rejectVendor(v: ModerationVendor): void {
        this.api.moderateVendor(v.id, 'reject').subscribe({
            next: () => this.removeVendor(v.id),
            error: (err) => this.error.set(this.errMsg(err)),
        });
    }

    protected approveProduct(p: ModerationProduct): void {
        this.api.moderateProduct(p.id, 'approve').subscribe({
            next: () => this.removeProduct(p.id),
            error: (err) => this.error.set(this.errMsg(err)),
        });
    }

    protected rejectProduct(p: ModerationProduct): void {
        this.api.moderateProduct(p.id, 'reject').subscribe({
            next: () => this.removeProduct(p.id),
            error: (err) => this.error.set(this.errMsg(err)),
        });
    }

    private removeVendor(id: string): void {
        this.vendors.update((list) => list.filter((x) => x.id !== id));
    }

    private removeProduct(id: string): void {
        this.products.update((list) => list.filter((x) => x.id !== id));
    }

    private reload(): void {
        this.loading.set(true);
        this.api.listVendors('pending').subscribe({
            next: (v) => this.vendors.set(v),
            error: (err) => this.error.set(this.errMsg(err)),
        });
        this.api.listProducts('pending').subscribe({
            next: (p) => {
                this.products.set(p);
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(this.errMsg(err));
                this.loading.set(false);
            },
        });
    }

    private errMsg(err: unknown): string {
        if (err && typeof err === 'object' && 'error' in err) {
            const body = (err as { error?: { message?: string } }).error;
            if (body?.message) {
                return body.message;
            }
        }
        return this.t('admin.common.error');
    }
}
