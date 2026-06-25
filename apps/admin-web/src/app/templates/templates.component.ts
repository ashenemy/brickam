import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { ButtonComponent, InputComponent, SelectComponent } from '@brickam/ui-kit';
import {
    type Template,
    type TemplateLang,
    type TemplateListItem,
    type TemplatePreview,
    TemplatesApiService,
    type UpdateTemplatePayload,
} from './templates-api.service';

const TEXTAREA_CLASS =
    'min-w-0 rounded-md border-0 px-5 py-4 bg-[rgb(var(--color-neutral-900)/0.9)] text-text-primary font-input text-18 outline-none shadow-[inset_0_0_0_1px_var(--border-subtle),var(--shadow-inset)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]';

/**
 * Редактор шаблонов: список (выбор по ключу) → форма.
 * Форма: контент по локалям hy/ru/en (textarea), список переменных (CSV-строка),
 * subject. «Сохранить» → PUT. «Превью» → POST .../preview (lang + sample vars
 * по списку variables) и показывает отрендеренный текст.
 */
@Component({
    selector: 'app-templates',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonComponent, InputComponent, SelectComponent],
    template: `
        <section class="flex flex-col gap-8">
            <h1 class="text-text-primary" style="font: var(--type-display)">
                {{ t('admin.templates.title') }}
            </h1>

            @if (error()) {
                <p class="text-danger" role="alert">{{ error() }}</p>
            }
            @if (saved()) {
                <p class="text-success" role="status">{{ t('admin.templates.saved') }}</p>
            }

            <div class="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
                <aside class="flex flex-col gap-2">
                    <h2 class="text-text-secondary" style="font: var(--type-product)">
                        {{ t('admin.templates.list') }}
                    </h2>
                    @for (item of templates(); track item.key) {
                        <button
                            type="button"
                            class="text-left px-4 py-2 rounded-md cursor-pointer text-text-primary hover:bg-surface-chip"
                            [class.bg-surface-chip]="item.key === selectedKey()"
                            (click)="select(item.key)"
                        >
                            {{ item.key }}
                        </button>
                    }
                </aside>

                @if (current(); as tpl) {
                    <div class="flex flex-col gap-4">
                        <h2 class="text-text-primary" style="font: var(--type-heading)">
                            {{ tpl.key }}
                        </h2>
                        <bh-input
                            [label]="t('admin.templates.subject')"
                            [value]="subject()"
                            (changed)="subject.set($event)"
                        />
                        <label class="flex flex-col gap-2 min-w-0">
                            <span class="text-text-secondary" style="font: var(--type-product)">
                                {{ t('admin.templates.contentHy') }}
                            </span>
                            <textarea rows="4" [value]="contentHy()" (input)="setText(contentHy, $event)" [class]="taClass"></textarea>
                        </label>
                        <label class="flex flex-col gap-2 min-w-0">
                            <span class="text-text-secondary" style="font: var(--type-product)">
                                {{ t('admin.templates.contentRu') }}
                            </span>
                            <textarea rows="4" [value]="contentRu()" (input)="setText(contentRu, $event)" [class]="taClass"></textarea>
                        </label>
                        <label class="flex flex-col gap-2 min-w-0">
                            <span class="text-text-secondary" style="font: var(--type-product)">
                                {{ t('admin.templates.contentEn') }}
                            </span>
                            <textarea rows="4" [value]="contentEn()" (input)="setText(contentEn, $event)" [class]="taClass"></textarea>
                        </label>
                        <bh-input
                            [label]="t('admin.templates.variables')"
                            [hint]="t('admin.templates.variablesHint')"
                            [value]="variablesCsv()"
                            (changed)="variablesCsv.set($event)"
                        />

                        <div class="flex flex-wrap items-end gap-3">
                            <bh-select
                                [label]="t('admin.templates.previewLang')"
                                [options]="langOptions()"
                                [value]="previewLang()"
                                (changed)="previewLang.set($any($event))"
                            />
                            <bh-button variant="primary" [disabled]="saving()" (clicked)="save()">
                                {{ saving() ? t('admin.common.saving') : t('admin.common.save') }}
                            </bh-button>
                            <bh-button variant="secondary" data-testid="preview-btn" (clicked)="preview()">
                                {{ t('admin.templates.preview') }}
                            </bh-button>
                        </div>

                        @if (previewResult(); as pr) {
                            <div class="flex flex-col gap-2 rounded-md p-5 bg-surface-card">
                                <span class="text-text-secondary" style="font: var(--type-product)">
                                    {{ t('admin.templates.previewResult') }}
                                </span>
                                @if (pr.subject) {
                                    <strong class="text-text-primary">{{ pr.subject }}</strong>
                                }
                                <pre class="whitespace-pre-wrap text-text-primary" data-testid="preview-rendered">{{ pr.rendered }}</pre>
                            </div>
                        }
                    </div>
                }
            </div>
        </section>
    `,
})
export class TemplatesComponent {
    private readonly api = inject(TemplatesApiService);
    private readonly i18n = inject(LanguageService);

    protected readonly taClass = TEXTAREA_CLASS;
    protected readonly templates = signal<TemplateListItem[]>([]);
    protected readonly selectedKey = signal<string | null>(null);
    protected readonly current = signal<Template | null>(null);

    protected readonly subject = signal('');
    protected readonly contentHy = signal('');
    protected readonly contentRu = signal('');
    protected readonly contentEn = signal('');
    protected readonly variablesCsv = signal('');
    protected readonly previewLang = signal<TemplateLang>('ru');
    protected readonly previewResult = signal<TemplatePreview | null>(null);

    protected readonly saving = signal(false);
    protected readonly saved = signal(false);
    protected readonly error = signal<string | null>(null);

    protected readonly langOptions = computed(() => [
        { label: 'HY', value: 'hy' },
        { label: 'RU', value: 'ru' },
        { label: 'EN', value: 'en' },
    ]);

    constructor() {
        this.api.list().subscribe({
            next: (items) => {
                this.templates.set(items);
                if (items.length > 0) {
                    this.select(items[0].key);
                }
            },
            error: (err) => this.error.set(this.errMsg(err)),
        });
    }

    protected t(key: string): string {
        return this.i18n.t(key);
    }

    protected setText(target: { set(v: string): void }, event: Event): void {
        target.set((event.target as HTMLTextAreaElement).value);
    }

    protected select(key: string): void {
        this.selectedKey.set(key);
        this.previewResult.set(null);
        this.saved.set(false);
        this.api.get(key).subscribe({
            next: (tpl) => {
                this.current.set(tpl);
                this.subject.set(tpl.subject ?? '');
                this.contentHy.set(tpl.content.hy ?? '');
                this.contentRu.set(tpl.content.ru ?? '');
                this.contentEn.set(tpl.content.en ?? '');
                this.variablesCsv.set((tpl.variables ?? []).join(', '));
            },
            error: (err) => this.error.set(this.errMsg(err)),
        });
    }

    protected save(): void {
        const key = this.selectedKey();
        if (!key) {
            return;
        }
        this.saving.set(true);
        this.saved.set(false);
        this.error.set(null);
        const payload: UpdateTemplatePayload = {
            content: { hy: this.contentHy(), ru: this.contentRu(), en: this.contentEn() },
            variables: this.variables(),
        };
        const subject = this.subject().trim();
        if (subject) {
            payload.subject = subject;
        }
        this.api.update(key, payload).subscribe({
            next: () => {
                this.saving.set(false);
                this.saved.set(true);
            },
            error: (err) => {
                this.saving.set(false);
                this.error.set(this.errMsg(err));
            },
        });
    }

    protected preview(): void {
        const key = this.selectedKey();
        if (!key) {
            return;
        }
        this.error.set(null);
        const vars: Record<string, string> = {};
        for (const v of this.variables()) {
            vars[v] = `{${v}}`;
        }
        this.api.preview(key, this.previewLang(), vars).subscribe({
            next: (res) => this.previewResult.set(res),
            error: (err) => this.error.set(this.errMsg(err)),
        });
    }

    private variables(): string[] {
        return this.variablesCsv()
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
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
