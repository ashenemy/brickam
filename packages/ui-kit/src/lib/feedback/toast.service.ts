import { Injectable, inject } from '@angular/core';
import {
    MatSnackBar,
    type MatSnackBarRef,
    type TextOnlySnackBar,
} from '@angular/material/snack-bar';

export type ToastTone = 'success' | 'accent' | 'danger' | 'info';

export interface ToastOptions {
    tone?: ToastTone;
    /** Авто-дисмисс через N мс. 0 — не скрывать автоматически. */
    duration?: number;
    /** Текст кнопки действия (напр. «Undo»). */
    action?: string;
}

/**
 * BRICK Toast — на официальном `MatSnackBar` (Material-идиома тостов — сервисная).
 * Тон задаёт panelClass `bh-toast bh-toast-<tone>` (стили — в брендовом слое токенов).
 * Заменяет прежний декларативный bh-toast (Material не даёт inline-примитива тоста).
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
    private readonly snackBar = inject(MatSnackBar);

    show(message: string, options: ToastOptions = {}): MatSnackBarRef<TextOnlySnackBar> {
        const tone = options.tone ?? 'success';
        return this.snackBar.open(message, options.action, {
            duration: options.duration ?? 4000,
            panelClass: ['bh-toast', `bh-toast-${tone}`],
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
        });
    }
}
