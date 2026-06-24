import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@brickam/ui-kit';

@Component({
    selector: 'app-forbidden',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonComponent, RouterLink],
    template: `
        <section class="flex flex-col items-center gap-4 py-16 text-center">
            <h1 class="text-text-primary" style="font: var(--type-display)">403 — нет доступа</h1>
            <p class="text-text-secondary">Этот кабинет доступен только продавцам.</p>
            <a routerLink="/"><bh-button variant="ghost">На главную</bh-button></a>
        </section>
    `,
})
export class ForbiddenComponent {}
