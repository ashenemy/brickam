import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';

export type TabValue = string | number;

export interface TabItem {
    label: string;
    value: TabValue;
}

/**
 * BRICK Tabs — underline tab strip (Poppins) с оранжевым активным подчёркиванием.
 * Перенесён с React (navigation/Tabs.jsx); цвета только через токены.
 * Фиксы a11y: настоящий role="tablist"/"tab", aria-selected, навигация стрелками
 * Left/Right (roving tabindex), видимый focus-ring; контент через role="tabpanel".
 * Двусторонняя привязка активной вкладки через model().
 */
@Component({
    selector: 'bh-tabs',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div
            role="tablist"
            class="flex gap-10 overflow-x-auto border-b border-b-[var(--border-subtle)]"
        >
            @for (tab of normalized(); track tab.value; let i = $index) {
                <button
                    type="button"
                    role="tab"
                    [id]="tabId(tab.value)"
                    [attr.aria-selected]="tab.value === value()"
                    [attr.aria-controls]="panelId()"
                    [tabindex]="tab.value === value() ? 0 : -1"
                    [class]="tabClasses(tab.value)"
                    (click)="select(tab.value)"
                    (keydown)="onKeydown($event, i)"
                >
                    {{ tab.label }}
                    <span
                        aria-hidden="true"
                        class="absolute -bottom-px left-0 right-0 h-0.5 rounded-[2px] bg-accent origin-left transition-transform duration-base ease-out"
                        [style.transform]="tab.value === value() ? 'scaleX(1)' : 'scaleX(0)'"
                    ></span>
                </button>
            }
        </div>
        <div
            role="tabpanel"
            [id]="panelId()"
            [attr.aria-labelledby]="value() !== undefined ? tabId(value()!) : null"
        >
            <ng-content />
        </div>
    `,
})
export class TabsComponent {
    readonly tabs = input<(TabItem | string)[]>([]);
    /** Активная вкладка (two-way). */
    readonly value = model<TabValue | undefined>(undefined);
    readonly changed = output<TabValue>();
    /** Базовый id для генерации id вкладок/панели. */
    readonly idBase = input('bh-tabs');

    protected readonly normalized = computed<TabItem[]>(() =>
        this.tabs().map((t) =>
            typeof t === 'string' || typeof t === 'number' ? { label: String(t), value: t } : t,
        ),
    );

    protected panelId(): string {
        return `${this.idBase()}-panel`;
    }

    protected tabId(value: TabValue): string {
        return `${this.idBase()}-tab-${value}`;
    }

    protected tabClasses(value: TabValue): string {
        const active = value === this.value();
        return [
            'relative pb-4 border-0 bg-transparent cursor-pointer whitespace-nowrap',
            'font-display text-20 transition-colors duration-base ease-out',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-accent))]',
            active ? 'font-medium text-text-primary' : 'font-normal text-text-secondary',
        ].join(' ');
    }

    protected select(value: TabValue): void {
        if (value === this.value()) {
            return;
        }
        this.value.set(value);
        this.changed.emit(value);
    }

    protected onKeydown(event: KeyboardEvent, index: number): void {
        const items = this.normalized();
        if (items.length === 0) {
            return;
        }
        let next = index;
        if (event.key === 'ArrowRight') {
            next = (index + 1) % items.length;
        } else if (event.key === 'ArrowLeft') {
            next = (index - 1 + items.length) % items.length;
        } else if (event.key === 'Home') {
            next = 0;
        } else if (event.key === 'End') {
            next = items.length - 1;
        } else {
            return;
        }
        event.preventDefault();
        const target = items[next];
        this.select(target.value);
        const host = event.target as HTMLElement;
        const tablist = host.closest('[role="tablist"]');
        const buttons = tablist?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
        buttons?.[next]?.focus();
    }
}
