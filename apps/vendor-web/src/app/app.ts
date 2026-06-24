import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LangSwitcherComponent } from '@brickam/i18n-kit/browser';
import { NxWelcome } from './nx-welcome';

@Component({
    imports: [NxWelcome, RouterModule, LangSwitcherComponent],
    selector: 'app-root',
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {
    protected title = 'vendor-web';
}
