import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LangSwitcherComponent, LanguageService } from '@brickam/i18n-kit/browser';
import { FooterComponent, NavbarComponent } from '@brickam/ui-kit';

/** Пункт навигации админки: подпись (i18n) и маршрут. */
type AdminNavItem = { labelKey: string; path: string };

const NAV: readonly AdminNavItem[] = [
    { labelKey: 'admin.nav.moderation', path: 'moderation' },
    { labelKey: 'admin.nav.settings', path: 'settings' },
    { labelKey: 'admin.nav.disputes', path: 'disputes' },
    { labelKey: 'admin.nav.analytics', path: 'analytics' },
    { labelKey: 'admin.nav.templates', path: 'templates' },
    { labelKey: 'admin.nav.loyalty', path: 'loyalty' },
    { labelKey: 'admin.nav.audit', path: 'audit' },
];

@Component({
    imports: [RouterModule, NavbarComponent, FooterComponent, LangSwitcherComponent],
    selector: 'app-root',
    templateUrl: './app.html',
    styleUrl: './app.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
    private readonly router = inject(Router);
    private readonly i18n = inject(LanguageService);

    /** Подписи для navbar (вычисляются по текущему языку). */
    protected readonly adminNav = computed(() => NAV.map((item) => this.i18n.t(item.labelKey)));

    /** Переход по выбранной подписи navbar. */
    protected onNav(label: string): void {
        const labels = this.adminNav();
        const index = labels.indexOf(label);
        if (index >= 0) {
            void this.router.navigate([NAV[index].path]);
        }
    }
}
