import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * SSR ВРЕМЕННО ОТКЛЮЧЁН: все маршруты рендерятся на клиенте (RenderMode.Client).
 * Инфраструктура серверного рендера сохранена (server.ts, main.server.ts, ssr-
 * таргет сборки, провайдеры гидрации) — чтобы вернуть серверный/пререндер-режим,
 * замените catch-all ниже на прежние per-route правила (Server/Prerender).
 */
export const serverRoutes: ServerRoute[] = [{ path: '**', renderMode: RenderMode.Client }];
