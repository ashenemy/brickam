import { Injectable, inject, signal } from '@angular/core';
import type { Lang } from '@brickam/i18n-kit/browser';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { catchError, of } from 'rxjs';
import type { ChangePasswordInput, Profile, UpdateProfileInput } from './models';
import { ProfileApiService } from './profile-api.service';

/**
 * Состояние профиля покупателя поверх ProfileApiService. Держит загруженный
 * профиль и флаги загрузки/сохранения. SSR-безопасно: ошибки/401 глушатся,
 * profile остаётся null. Смена языка профиля синхронизируется с LanguageService.
 */
@Injectable({ providedIn: 'root' })
export class ProfileStore {
    private readonly api = inject(ProfileApiService);
    private readonly i18n = inject(LanguageService);

    readonly profile = signal<Profile | null>(null);
    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly saved = signal(false);
    readonly error = signal(false);

    /** Загрузить профиль. Безопасно при SSR/без токена. */
    load(): void {
        this.loading.set(true);
        this.api
            .me()
            .pipe(catchError(() => of(null)))
            .subscribe((data) => {
                if (data) {
                    this.profile.set(data);
                }
                this.loading.set(false);
            });
    }

    /** Сохранить профиль. При смене языка — применить его в интерфейсе. */
    save(input: UpdateProfileInput): void {
        this.saving.set(true);
        this.saved.set(false);
        this.error.set(false);
        this.api.update(input).subscribe({
            next: (data) => {
                this.profile.set(data);
                if (input.lang) {
                    this.i18n.setLang(input.lang as Lang);
                }
                this.saving.set(false);
                this.saved.set(true);
            },
            error: () => {
                this.saving.set(false);
                this.error.set(true);
            },
        });
    }

    /** Сменить пароль; onDone(ok) сообщает результат для очистки формы. */
    changePassword(input: ChangePasswordInput, onDone: (ok: boolean) => void): void {
        this.saving.set(true);
        this.api.changePassword(input).subscribe({
            next: () => {
                this.saving.set(false);
                onDone(true);
            },
            error: () => {
                this.saving.set(false);
                onDone(false);
            },
        });
    }
}
