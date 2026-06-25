import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { ButtonComponent, InputComponent } from '@brickam/ui-kit';
import { MembersApiService, type VendorMember } from './members-api.service';

/** Описание права: код + i18n-ключ заголовка чекбокса. */
type PermDef = {
    code: string;
    key: string;
};

const PERMS: readonly PermDef[] = [
    { code: 'orders.view', key: 'vendor.members.perm.ordersView' },
    { code: 'products.manage', key: 'vendor.members.perm.productsManage' },
    { code: 'analytics.view', key: 'vendor.members.perm.analyticsView' },
    { code: 'chat.handle', key: 'vendor.members.perm.chatHandle' },
    { code: 'invoices.create', key: 'vendor.members.perm.invoicesCreate' },
];

/**
 * Суб-аккаунты вендора: список (телефон/права) + добавление по телефону
 * с чекбоксами прав + удаление. Каждая строка показывает текущие права.
 */
@Component({
    selector: 'app-members',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonComponent, InputComponent],
    template: `
        <section class="flex flex-col gap-8">
            <h1 class="text-text-primary" style="font: var(--type-display)">
                {{ t('vendor.members.title') }}
            </h1>

            @if (error()) {
                <p class="text-danger" role="alert">{{ error() }}</p>
            }

            <div class="flex flex-col gap-4 rounded-md p-5 bg-surface-card">
                <h2 class="text-text-primary" style="font: var(--type-heading)">
                    {{ t('vendor.members.add') }}
                </h2>
                <bh-input
                    [label]="t('vendor.members.field.phone')"
                    [value]="phone()"
                    (changed)="phone.set($event)"
                />
                <div class="flex flex-wrap gap-4">
                    @for (perm of perms; track perm.code) {
                        <label class="flex items-center gap-2 text-text-primary">
                            <input
                                type="checkbox"
                                [checked]="hasPerm(perm.code)"
                                (change)="togglePerm(perm.code)"
                            />
                            <span>{{ t(perm.key) }}</span>
                        </label>
                    }
                </div>
                <div>
                    <bh-button
                        variant="primary"
                        [disabled]="saving() || phone().trim().length === 0"
                        (clicked)="add()"
                    >
                        {{ saving() ? t('vendor.common.saving') : t('vendor.members.add') }}
                    </bh-button>
                </div>
            </div>

            @if (loading()) {
                <p class="text-text-secondary">{{ t('vendor.common.loading') }}</p>
            } @else if (members().length === 0) {
                <p class="text-text-secondary">{{ t('vendor.members.empty') }}</p>
            } @else {
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-text-primary">
                        <thead class="text-text-secondary" style="font: var(--type-product)">
                            <tr>
                                <th class="py-2 pr-4">{{ t('vendor.members.col.name') }}</th>
                                <th class="py-2 pr-4">{{ t('vendor.members.col.permissions') }}</th>
                                <th class="py-2">{{ t('vendor.products.col.actions') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (m of members(); track m.userId) {
                                <tr class="border-t border-[var(--border-subtle)]">
                                    <td class="py-3 pr-4">{{ m.userId }}</td>
                                    <td class="py-3 pr-4">{{ m.permissions.join(', ') }}</td>
                                    <td class="py-3">
                                        <bh-button size="sm" variant="danger" (clicked)="remove(m)">
                                            {{ t('vendor.common.delete') }}
                                        </bh-button>
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
export class MembersComponent {
    private readonly api = inject(MembersApiService);
    private readonly i18n = inject(LanguageService);

    protected readonly perms = PERMS;
    protected readonly members = signal<VendorMember[]>([]);
    protected readonly loading = signal(true);
    protected readonly saving = signal(false);
    protected readonly error = signal<string | null>(null);
    protected readonly phone = signal('');
    private readonly selectedPerms = signal<string[]>(['orders.view']);

    constructor() {
        this.reload();
    }

    protected t(key: string): string {
        return this.i18n.t(key);
    }

    protected hasPerm(code: string): boolean {
        return this.selectedPerms().includes(code);
    }

    protected togglePerm(code: string): void {
        this.selectedPerms.update((list) =>
            list.includes(code) ? list.filter((x) => x !== code) : [...list, code],
        );
    }

    protected add(): void {
        if (this.phone().trim().length === 0 || this.saving()) {
            return;
        }
        this.saving.set(true);
        this.error.set(null);
        this.api.add(this.phone().trim(), this.selectedPerms()).subscribe({
            next: (member) => {
                this.members.update((list) => [...list, member]);
                this.phone.set('');
                this.saving.set(false);
            },
            error: (err) => {
                this.error.set(this.errMsg(err));
                this.saving.set(false);
            },
        });
    }

    protected remove(member: VendorMember): void {
        this.api.remove(member.userId).subscribe({
            next: () =>
                this.members.update((list) => list.filter((m) => m.userId !== member.userId)),
            error: (err) => this.error.set(this.errMsg(err)),
        });
    }

    private reload(): void {
        this.loading.set(true);
        this.api.list().subscribe({
            next: (items) => {
                this.members.set(items);
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
        return this.t('vendor.common.error');
    }
}
