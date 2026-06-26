import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';

export type TabValue = string | number;

export interface TabItem {
    label: string;
    value: TabValue;
}

/**
 * BRICK Tabs — на официальном `mat-tab-nav-bar` (вариант «полоска + внешняя панель»,
 * не владеющий контентом — совпадает с прежним value-driven API). Оранжевый ink-bar
 * через --mat-sys-primary. Активная вкладка — two-way [(value)]; контент в ng-content.
 */
@Component({
    selector: 'bh-tabs',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatTabNav, MatTabLink, MatTabNavPanel],
    template: `
        <nav mat-tab-nav-bar [tabPanel]="panel" class="font-display">
            @for (tab of normalized(); track tab.value) {
                <a
                    mat-tab-link
                    [active]="tab.value === value()"
                    (click)="select(tab.value)"
                >
                    {{ tab.label }}
                </a>
            }
        </nav>
        <mat-tab-nav-panel #panel>
            <ng-content />
        </mat-tab-nav-panel>
    `,
})
export class TabsComponent {
    readonly tabs = input<(TabItem | string)[]>([]);
    /** Активная вкладка (two-way). */
    readonly value = model<TabValue | undefined>(undefined);
    readonly changed = output<TabValue>();

    protected readonly normalized = computed<TabItem[]>(() =>
        this.tabs().map((t) =>
            typeof t === 'string' || typeof t === 'number' ? { label: String(t), value: t } : t,
        ),
    );

    protected select(value: TabValue): void {
        if (value === this.value()) {
            return;
        }
        this.value.set(value);
        this.changed.emit(value);
    }
}
