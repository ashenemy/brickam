import { Role } from '@brickam/domain-kit';
import { describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';

function makeController() {
    const auth = {
        register: vi.fn().mockResolvedValue({ otpSent: true }),
        verifyOtp: vi.fn().mockResolvedValue({ tokens: { accessToken: 'a', refreshToken: 'r' } }),
        login: vi.fn().mockResolvedValue({ tokens: { accessToken: 'a', refreshToken: 'r' } }),
        refresh: vi.fn().mockResolvedValue({ tokens: { accessToken: 'a', refreshToken: 'r' } }),
        forgot: vi.fn().mockResolvedValue({ otpSent: true }),
        reset: vi.fn().mockResolvedValue({ success: true }),
    } as unknown as AuthService;
    return { auth, controller: new AuthController(auth) };
}

describe('AuthController', () => {
    it('делегирует register', async () => {
        const { auth, controller } = makeController();
        const dto = { phone: '+37412345678', password: 'secret123', name: 'N', role: Role.Buyer };
        await expect(controller.register(dto)).resolves.toEqual({ otpSent: true });
        expect(auth.register).toHaveBeenCalledWith(dto);
    });

    it('делегирует verifyOtp', async () => {
        const { auth, controller } = makeController();
        const dto = { phone: '+37412345678', code: '123456' };
        await controller.verifyOtp(dto);
        expect(auth.verifyOtp).toHaveBeenCalledWith(dto);
    });

    it('делегирует login', async () => {
        const { auth, controller } = makeController();
        const dto = { phone: '+37412345678', password: 'secret123' };
        await controller.login(dto);
        expect(auth.login).toHaveBeenCalledWith(dto);
    });

    it('делегирует refresh', async () => {
        const { auth, controller } = makeController();
        const dto = { refreshToken: 'r' };
        await controller.refresh(dto);
        expect(auth.refresh).toHaveBeenCalledWith(dto);
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
});
