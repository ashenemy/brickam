import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Avatar — круг пользователя/продавца. Фолбэк на инициалы на тёплом фоне.
 * Перенесён с React (core/Avatar.jsx).
 */
@Component({
    selector: 'bh-avatar',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <span
            class="inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 bg-surface-chip text-accent font-display font-semibold"
            [style.boxShadow]="boxShadow()"
            [style.width.px]="size()"
            [style.height.px]="size()"
            [style.fontSize.px]="size() * 0.38"
        >
            @if (src()) {
                <img [src]="src()" [alt]="name()" class="w-full h-full object-cover" />
            } @else {
                {{ initials() || '?' }}
            }
        </span>
    `,
})
export class AvatarComponent {
    readonly src = input<string | null>(null);
    readonly name = input('');
    readonly size = input(40);
    readonly ring = input(false);

    protected readonly initials = computed(() =>
        this.name()
            .split(' ')
            .map((word) => word[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase(),
    );

    protected readonly boxShadow = computed(() =>
        this.ring()
            ? '0 0 0 2px rgb(var(--color-accent))'
            : 'inset 0 0 0 0.5px var(--border-default)',
    );
}
