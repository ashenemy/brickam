import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LangSwitcherComponent } from '@brickam/i18n-kit/browser';
import { FooterComponent, NavbarComponent } from '@brickam/ui-kit';

@Component({
    imports: [RouterModule, NavbarComponent, FooterComponent, LangSwitcherComponent],
    selector: 'app-root',
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {
    protected readonly adminNav = ['Vendors', 'Catalog', 'Orders', 'Settings'];

    protected onNav(_item: string): void {
        // разделы админки подключатся с реальными маршрутами в следующих стейджах
    }
}
