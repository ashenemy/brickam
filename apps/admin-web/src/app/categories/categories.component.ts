import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { InputComponent, SwitchComponent } from '@brickam/ui-kit';
import {
    type AdminCategory,
    CategoriesAdminApiService,
    type CategoryPatch,
} from './categories-api.service';

/**
 * Управление категориями каталога (роль admin). Список категорий (корни +
 * подкатегории) с переключателем «показывать на главной» (featuredOnHome) и
 * полем URL обложки. Любое изменение сразу сохраняется PATCH-ом. Реальные данные.
 */
@Component({
    selector: 'app-admin-categories',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [InputComponent, SwitchComponent],
    template: `
        <section class="flex flex-col gap-6">
            <header class="flex flex-col gap-1">
                <h1 class="m-0 text-text-primary" style="font: var(--type-display)">Categories</h1>
                <p class="m-0 text-text-secondary" style="font: var(--type-product)">
                    Mark categories to feature on the storefront home («Shop by room») and set a
                    cover image URL.
                </p>
            </header>

            @if (error()) {
                <p class="text-danger" role="alert">{{ error() }}</p>
            }

            @if (loading()) {
                <p class="text-text-secondary" style="font: var(--type-product)">Loading…</p>
            } @else {
                <div class="flex flex-col gap-2">
                    @for (cat of categories(); track cat.id) {
                        <div
                            class="flex flex-wrap items-center gap-4 rounded-md bg-surface-card p-4"
                            [class.opacity-80]="cat.parentId"
                        >
                            <div class="min-w-0 flex-1" [class.pl-6]="cat.parentId">
                                <div class="text-text-primary" style="font: var(--type-label)">
                                    {{ cat.name.en }}
                                </div>
                                <div class="text-text-tertiary" style="font: var(--type-caption)">
                                    {{ cat.slug }}
                                </div>
                            </div>
                            <bh-input
                                class="w-full sm:w-80"
                                placeholder="Cover image URL"
                                [value]="cat.coverUrl ?? ''"
                                (changed)="onCover(cat, $event)"
                            />
                            <bh-switch
                                label="On home"
                                [value]="!!cat.featuredOnHome"
                                (changed)="onFeatured(cat, $event)"
                            />
                        </div>
                    }
                </div>
            }
        </section>
    `,
})
export class CategoriesComponent {
    private readonly api = inject(CategoriesAdminApiService);

    protected readonly categories = signal<AdminCategory[]>([]);
    protected readonly loading = signal(true);
    protected readonly error = signal<string | null>(null);

    constructor() {
        this.api.list().subscribe({
            next: (cats) => {
                this.categories.set(this.sortTree(cats));
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(this.errMsg(err));
                this.loading.set(false);
            },
        });
    }

    protected onFeatured(cat: AdminCategory, value: boolean): void {
        this.patch(cat, { featuredOnHome: value });
    }

    protected onCover(cat: AdminCategory, value: string): void {
        this.patch(cat, { coverUrl: value });
    }

    private patch(cat: AdminCategory, patch: CategoryPatch): void {
        this.error.set(null);
        this.api.update(cat.id, patch).subscribe({
            next: () =>
                this.categories.update((list) =>
                    list.map((c) => (c.id === cat.id ? { ...c, ...patch } : c)),
                ),
            error: (err) => this.error.set(this.errMsg(err)),
        });
    }

    /** Корни по order, каждый сразу со своими подкатегориями. */
    private sortTree(cats: AdminCategory[]): AdminCategory[] {
        const byOrder = (a: AdminCategory, b: AdminCategory) => a.order - b.order;
        const roots = cats.filter((c) => !c.parentId).sort(byOrder);
        const out: AdminCategory[] = [];
        for (const root of roots) {
            out.push(root);
            out.push(...cats.filter((c) => c.parentId === root.id).sort(byOrder));
        }
        return out;
    }

    private errMsg(err: unknown): string {
        if (err && typeof err === 'object' && 'error' in err) {
            const body = (err as { error?: { message?: string } }).error;
            if (body?.message) {
                return body.message;
            }
        }
        return 'Request failed';
    }
}
