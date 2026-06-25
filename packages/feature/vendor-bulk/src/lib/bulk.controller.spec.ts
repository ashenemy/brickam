import { ValidationException } from '@brickam/core-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BulkController } from './bulk.controller';
import type { BulkService } from './bulk.service';
import type { BulkRequestDto } from './dto/bulk.dto';

describe('BulkController', () => {
    let service: {
        preview: ReturnType<typeof vi.fn>;
        apply: ReturnType<typeof vi.fn>;
    };
    let controller: BulkController;

    const makeDto = (op: unknown): BulkRequestDto =>
        ({ productIds: ['p1'], op }) as unknown as BulkRequestDto;

    beforeEach(() => {
        service = {
            preview: vi.fn().mockResolvedValue({ affected: 0, previews: [] }),
            apply: vi.fn().mockResolvedValue({ mode: 'sync', modified: 0 }),
        };
        controller = new BulkController(service as unknown as BulkService);
    });

    it('preview: vendorId из контекста, делегирует сервису', async () => {
        const op = { kind: 'status', status: 'hidden' };
        await controller.preview({ id: 'v1' }, makeDto(op));
        expect(service.preview).toHaveBeenCalledWith('v1', ['p1'], op);
    });

    it('apply: vendorId из контекста, делегирует сервису', async () => {
        const op = { kind: 'price', mode: 'set', value: 10 };
        await controller.apply({ id: 'v1' }, makeDto(op));
        expect(service.apply).toHaveBeenCalledWith('v1', ['p1'], op);
    });

    it('нет контекста продавца → ValidationException', () => {
        const op = { kind: 'discountRemove' };
        // controller.apply — доменный метод, не Function.prototype.apply.
        // eslint-disable-next-line prefer-spread
        expect(() => controller.apply(undefined, makeDto(op))).toThrow(ValidationException);
    });

    it('некорректная операция → ValidationException', () => {
        expect(() => controller.preview({ id: 'v1' }, makeDto({ kind: 'unknown' }))).toThrow(
            ValidationException,
        );
        expect(service.preview).not.toHaveBeenCalled();
    });
});
