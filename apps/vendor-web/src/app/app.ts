import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LangSwitcherComponent } from '@brickam/i18n-kit/browser';
import { FooterComponent } from '@brickam/ui-kit';

/**
 * Шелл vendor-web: верхняя навигация по разделам кабинета продавца
 * (RouterLink, активная подсветка), переключатель языка, контентный outlet.
 * Подписи навигации — статические строки (biome HTML-парсер без интерполяции);
 * локализация разделов — через ключи vendor.nav.* внутри самих страниц.
 */
@Component({
    selector: 'app-root',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterModule, FooterComponent, LangSwitcherComponent],
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {}
