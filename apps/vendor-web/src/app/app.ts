import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LangSwitcherComponent } from '@brickam/i18n-kit/browser';
import {
    AvatarComponent,
    BadgeComponent,
    ButtonComponent,
    IconButtonComponent,
    LogoComponent,
    RatingComponent,
    TagComponent,
} from '@brickam/ui-kit';

@Component({
    imports: [
        RouterModule,
        LangSwitcherComponent,
        LogoComponent,
        ButtonComponent,
        IconButtonComponent,
        BadgeComponent,
        TagComponent,
        AvatarComponent,
        RatingComponent,
    ],
    selector: 'app-root',
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {
    protected readonly filterSelected = signal(true);
}
