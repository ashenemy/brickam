import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { AuditApiService, type AuditEvent } from './audit-api.service';

/** Журнал аудита: таблица последних событий. */
@Component({
    selector: 'app-audit',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <section class="flex flex-col gap-8">
            <h1 class="text-text-primary" style="font: var(--type-display)">
                {{ t('admin.audit.title') }}
            </h1>

            @if (error()) {
                <p class="text-danger" role="alert">{{ error() }}</p>
            }

            @if (loading()) {
                <p class="text-text-secondary">{{ t('admin.common.loading') }}</p>
            } @else if (events().length === 0) {
                <p class="text-text-secondary">{{ t('admin.common.empty') }}</p>
            } @else {
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-text-primary">
                        <thead class="text-text-secondary" style="font: var(--type-product)">
                            <tr>
                                <th class="py-2 pr-4">{{ t('admin.audit.col.time') }}</th>
                                <th class="py-2 pr-4">{{ t('admin.audit.col.action') }}</th>
                                <th class="py-2 pr-4">{{ t('admin.audit.col.actor') }}</th>
                                <th class="py-2">{{ t('admin.audit.col.target') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (e of events(); track e.id) {
                                <tr class="border-t border-[var(--border-subtle)]">
                                    <td class="py-3 pr-4">{{ e.createdAt }}</td>
                                    <td class="py-3 pr-4">{{ e.action }}</td>
                                    <td class="py-3 pr-4">{{ e.actorId }}</td>
                                    <td class="py-3">{{ e.targetType }} {{ e.targetId }}</td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            }
        </section>
    `,
})
export class AuditComponent {
    private readonly api = inject(AuditApiService);
    private readonly i18n = inject(LanguageService);

    protected readonly events = signal<AuditEvent[]>([]);
    protected readonly loading = signal(true);
    protected readonly error = signal<string | null>(null);

    constructor() {
        this.api.list(50).subscribe({
            next: (items) => {
                this.events.set(items);
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
