import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { BadgeComponent, ButtonComponent, InputComponent, SelectComponent } from '@brickam/ui-kit';
import {
    type CreateProgramPayload,
    type DiscountType,
    LoyaltyApiService,
    type LoyaltyBasis,
    type LoyaltyProgram,
    type LoyaltyTier,
} from './loyalty-api.service';

/** Уровень формы (значения как строки из инпутов). */
type TierForm = {
    level: string;
    name: string;
    threshold: string;
    discountType: DiscountType;
    discountValue: string;
};

function emptyTier(level: number): TierForm {
    return {
        level: String(level),
        name: '',
        threshold: '0',
        discountType: 'percent',
        discountValue: '0',
    };
}

/**
 * Конструктор программ лояльности: список программ + форма создания.
 * Форма: basis (select) + редактируемый набор уровней
 * [{level,name,threshold,discountType,discountValue}]. «Создать» → POST,
 * «Активировать» по записи списка → POST .../activate.
 */
@Component({
    selector: 'app-loyalty',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonComponent, InputComponent, SelectComponent, BadgeComponent],
    template: `
        <section class="flex flex-col gap-8">
            <h1 class="text-text-primary" style="font: var(--type-display)">
                {{ t('admin.loyalty.title') }}
            </h1>

            @if (error()) {
                <p class="text-danger" role="alert">{{ error() }}</p>
            }

            <!-- Список программ -->
            <div class="flex flex-col gap-4">
                <h2 class="text-text-primary" style="font: var(--type-heading)">
                    {{ t('admin.loyalty.programs') }}
                </h2>
                @if (programs().length === 0) {
                    <p class="text-text-secondary">{{ t('admin.common.empty') }}</p>
                } @else {
                    <div class="flex flex-col gap-3">
                        @for (p of programs(); track p.id) {
                            <div class="flex flex-wrap items-center justify-between gap-3 rounded-md p-4 bg-surface-card">
                                <div class="flex items-center gap-3">
                                    <span class="text-text-primary">{{ p.basis }}</span>
                                    <span class="text-text-secondary">
                                        {{ p.tiers.length }} {{ t('admin.loyalty.tiersCount') }}
                                    </span>
                                    @if (p.active) {
                                        <bh-badge tone="success">{{ t('admin.loyalty.active') }}</bh-badge>
                                    }
                                </div>
                                @if (!p.active) {
                                    <bh-button size="sm" variant="primary" (clicked)="activate(p)">
                                        {{ t('admin.loyalty.activate') }}
                                    </bh-button>
                                }
                            </div>
                        }
                    </div>
                }
            </div>

            <!-- Форма создания -->
            <div class="flex flex-col gap-4 rounded-md p-5 bg-surface-card">
                <h2 class="text-text-primary" style="font: var(--type-heading)">
                    {{ t('admin.loyalty.create') }}
                </h2>
                <bh-select
                    class="max-w-xs"
                    [label]="t('admin.loyalty.basis')"
                    [options]="basisOptions()"
                    [value]="basis()"
                    (changed)="basis.set($any($event))"
                />

                <div class="flex flex-col gap-4">
                    @for (tier of tiers(); track $index) {
                        <div class="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                            <bh-input
                                type="number"
                                [label]="t('admin.loyalty.tier.level')"
                                [value]="tier.level"
                                (changed)="setTier($index, 'level', $event)"
                            />
                            <bh-input
                                [label]="t('admin.loyalty.tier.name')"
                                [value]="tier.name"
                                (changed)="setTier($index, 'name', $event)"
                            />
                            <bh-input
                                type="number"
                                [label]="t('admin.loyalty.tier.threshold')"
                                [value]="tier.threshold"
                                (changed)="setTier($index, 'threshold', $event)"
                            />
                            <bh-select
                                [label]="t('admin.loyalty.tier.discountType')"
                                [options]="discountOptions()"
                                [value]="tier.discountType"
                                (changed)="setTier($index, 'discountType', $any($event))"
                            />
                            <div class="flex gap-2 items-end">
                                <bh-input
                                    type="number"
                                    class="flex-1"
                                    [label]="t('admin.loyalty.tier.discountValue')"
                                    [value]="tier.discountValue"
                                    (changed)="setTier($index, 'discountValue', $event)"
                                />
                                <bh-button size="sm" variant="danger" (clicked)="removeTier($index)">
                                    ×
                                </bh-button>
                            </div>
                        </div>
                    }
                </div>

                <div class="flex flex-wrap gap-3">
                    <bh-button variant="secondary" (clicked)="addTier()">
                        {{ t('admin.loyalty.addTier') }}
                    </bh-button>
                    <bh-button variant="primary" data-testid="create-btn" [disabled]="saving() || tiers().length === 0" (clicked)="create()">
                        {{ saving() ? t('admin.common.saving') : t('admin.loyalty.create') }}
                    </bh-button>
                </div>
            </div>
        </section>
    `,
})
export class LoyaltyComponent {
    private readonly api = inject(LoyaltyApiService);
    private readonly i18n = inject(LanguageService);

    protected readonly programs = signal<LoyaltyProgram[]>([]);
    protected readonly basis = signal<LoyaltyBasis>('spend');
    protected readonly tiers = signal<TierForm[]>([emptyTier(1)]);
    protected readonly saving = signal(false);
    protected readonly error = signal<string | null>(null);

    protected readonly basisOptions = computed(() => [
        { label: this.t('admin.loyalty.basis.spend'), value: 'spend' },
        { label: this.t('admin.loyalty.basis.orders'), value: 'orders' },
    ]);

    protected readonly discountOptions = computed(() => [
        { label: this.t('admin.loyalty.discount.percent'), value: 'percent' },
        { label: this.t('admin.loyalty.discount.amount'), value: 'amount' },
    ]);

    constructor() {
        this.reload();
    }

    protected t(key: string): string {
        return this.i18n.t(key);
    }

    protected setTier(index: number, key: keyof TierForm, value: string): void {
        this.tiers.update((list) =>
            list.map((tier, i) => (i === index ? { ...tier, [key]: value } : tier)),
        );
    }

    protected addTier(): void {
        this.tiers.update((list) => [...list, emptyTier(list.length + 1)]);
    }

    protected removeTier(index: number): void {
        this.tiers.update((list) => list.filter((_, i) => i !== index));
    }

    protected create(): void {
        if (this.tiers().length === 0 || this.saving()) {
            return;
        }
        this.saving.set(true);
        this.error.set(null);
        const payload: CreateProgramPayload = {
            basis: this.basis(),
            tiers: this.tiers().map((tier) => this.toTier(tier)),
        };
        this.api.create(payload).subscribe({
            next: (created) => {
                this.saving.set(false);
                this.programs.update((list) => [created, ...list]);
                this.tiers.set([emptyTier(1)]);
            },
            error: (err) => {
                this.saving.set(false);
                this.error.set(this.errMsg(err));
            },
        });
    }

    protected activate(p: LoyaltyProgram): void {
        this.api.activate(p.id).subscribe({
            next: (updated) =>
                this.programs.update((list) =>
                    list.map((x) => ({ ...x, active: x.id === updated.id })),
                ),
            error: (err) => this.error.set(this.errMsg(err)),
        });
    }

    private toTier(form: TierForm): LoyaltyTier {
        return {
            level: this.num(form.level),
            name: form.name.trim(),
            threshold: this.num(form.threshold),
            discountType: form.discountType,
            discountValue: this.num(form.discountValue),
        };
    }

    private reload(): void {
        this.api.list().subscribe({
            next: (items) => this.programs.set(items),
            error: (err) => this.error.set(this.errMsg(err)),
        });
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
        return this.t('admin.common.error');
    }
}
