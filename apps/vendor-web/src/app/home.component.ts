import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
    AvatarComponent,
    BadgeComponent,
    ButtonComponent,
    RatingComponent,
    TagComponent,
} from '@brickam/ui-kit';

@Component({
    selector: 'app-home',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ButtonComponent,
        BadgeComponent,
        TagComponent,
        AvatarComponent,
        RatingComponent,
        RouterLink,
    ],
    template: `
        <section class="flex flex-col gap-6">
            <h1 class="text-text-primary" style="font: var(--type-display)">Vendor workspace</h1>
            <div class="flex flex-wrap items-center gap-3">
                <bh-button variant="primary">New product</bh-button>
                <bh-button variant="secondary">Orders</bh-button>
                <bh-button variant="ghost">Analytics</bh-button>
                <a routerLink="/invoices/new"><bh-button variant="primary">Новый инвойс</bh-button></a>
            </div>
            <div class="flex flex-wrap items-center gap-3">
                <bh-badge tone="success">In stock</bh-badge>
                <bh-badge tone="danger">Low stock</bh-badge>
                <bh-tag [selected]="filterSelected()" [count]="12" (toggled)="filterSelected.set(!filterSelected())">
                    Cement
                </bh-tag>
                <bh-rating [value]="4.5" [count]="128" [showValue]="true" />
                <bh-avatar name="BRICK Vendor" [size]="40" [ring]="true" />
            </div>
        </section>
    `,
})
export class HomeComponent {
    protected readonly filterSelected = signal(true);
}
