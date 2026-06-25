import type { AppConfigService } from '@brickam/config-kit';
import { Role } from '@brickam/domain-kit';
import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';

const makeRes = () => ({ cookie: vi.fn(), clearCookie: vi.fn() }) as unknown as Response;

function makeController() {
    const auth = {
        register: vi.fn().mockResolvedValue({ otpSent: true }),
        verifyOtp: vi.fn().mockResolvedValue({ tokens: { accessToken: 'a', refreshToken: 'r' } }),
        login: vi.fn().mockResolvedValue({ tokens: { accessToken: 'a', refreshToken: 'r' } }),
        refresh: vi.fn().mockResolvedValue({ tokens: { accessToken: 'a', refreshToken: 'r' } }),
        forgot: vi.fn().mockResolvedValue({ otpSent: true }),
        reset: vi.fn().mockResolvedValue({ success: true }),
    } as unknown as AuthService;
    const config = { isProduction: false } as unknown as AppConfigService;
    return { auth, controller: new AuthController(auth, config) };
}

describe('AuthController', () => {
    it('делегирует register', async () => {
        const { auth, controller } = makeController();
        const dto = { phone: '+37412345678', password: 'secret123', name: 'N', role: Role.Buyer };
        await expect(controller.register(dto)).resolves.toEqual({ otpSent: true });
        expect(auth.register).toHaveBeenCalledWith(dto);
    });

    it('делегирует verifyOtp и ставит cookie', async () => {
        const { auth, controller } = makeController();
        const dto = { phone: '+37412345678', code: '123456' };
        const res = makeRes();
        await controller.verifyOtp(dto, res);
        expect(auth.verifyOtp).toHaveBeenCalledWith(dto);
        expect(res.cookie).toHaveBeenCalledWith('access_token', 'a', expect.any(Object));
    });

    it('делегирует login и ставит cookie', async () => {
        const { auth, controller } = makeController();
        const dto = { phone: '+37412345678', password: 'secret123' };
        const res = makeRes();
        await controller.login(dto, res);
        expect(auth.login).toHaveBeenCalledWith(dto);
        expect(res.cookie).toHaveBeenCalled();
    });

    it('делегирует refresh', async () => {
        const { auth, controller } = makeController();
        const dto = { refreshToken: 'r' };
        await controller.refresh(dto, makeRes());
        expect(auth.refresh).toHaveBeenCalledWith(dto);
    });

    it('logout очищает cookie', () => {
        const { controller } = makeController();
        const res = makeRes();
        expect(controller.logout(res)).toEqual({ success: true });
        expect(res.clearCookie).toHaveBeenCalled();
    });

    it('делегирует forgot', async () => {
        const { auth, controller } = makeController();
        const dto = { phone: '+37412345678' };
        await controller.forgot(dto);
        expect(auth.forgot).toHaveBeenCalledWith(dto);
    });

    it('делегирует reset', async () => {
        const { auth, controller } = makeController();
        const dto = { phone: '+37412345678', code: '123456', newPassword: 'newsecret123' };
        await controller.reset(dto);
        expect(auth.reset).toHaveBeenCalledWith(dto);
    });

    it('me возвращает текущего пользователя из JWT', () => {
        const { controller } = makeController();
        const user = { id: 'u1', role: Role.Buyer, permissions: [] };
        expect(controller.me(user as never)).toBe(user);
    });
});
