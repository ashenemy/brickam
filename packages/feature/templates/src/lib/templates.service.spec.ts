import { NotFoundException } from '@brickam/core-kit';
import { DEFAULT_LANG } from '@brickam/i18n-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TemplateRenderer } from './template-renderer';
import type { TemplatesRepository } from './templates.repository';
import { TemplatesService } from './templates.service';

/** Документ-подобный шаблон. */
const makeTemplate = (over: Record<string, unknown> = {}) => ({
    id: 't1',
    key: 'auth.otp',
    type: 'sms',
    name: 'OTP',
    content: {
        hy: 'BRICK կոդ՝ {{code}}',
        ru: 'Код BRICK: {{code}}',
        en: 'BRICK code: {{code}}',
    },
    variables: ['code'],
    isActive: true,
    version: 1,
    ...over,
});

describe('TemplatesService', () => {
    let repo: {
        findByKey: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
        updateById: ReturnType<typeof vi.fn>;
        deleteById: ReturnType<typeof vi.fn>;
    };
    let service: TemplatesService;

    beforeEach(() => {
        repo = {
            findByKey: vi.fn(),
            create: vi.fn(),
            updateById: vi.fn(),
            deleteById: vi.fn(),
        };
        service = new TemplatesService(
            repo as unknown as TemplatesRepository,
            new TemplateRenderer(),
        );
    });

    it('реализует контракт TemplatesServiceContract', () => {
        expect(typeof service.renderByKey).toBe('function');
        expect(typeof service.getByKey).toBe('function');
    });

    it('renderByKey возвращает body для sms-шаблона', async () => {
        repo.findByKey.mockResolvedValue(makeTemplate());
        const result = await service.renderByKey('auth.otp', 'ru', { code: '1234' });
        expect(result).toEqual({ body: 'Код BRICK: 1234' });
    });

    it('renderByKey рендерит subject для email-шаблона', async () => {
        repo.findByKey.mockResolvedValue(
            makeTemplate({
                key: 'order.confirmation',
                type: 'email',
                subject: {
                    hy: 'Պատվեր {{orderNumber}}',
                    ru: 'Заказ {{orderNumber}}',
                    en: 'Order {{orderNumber}}',
                },
                content: {
                    hy: 'Գումար {{total}}',
                    ru: 'Сумма {{total}}',
                    en: 'Total {{total}}',
                },
                variables: ['orderNumber', 'total'],
            }),
        );
        const result = await service.renderByKey('order.confirmation', 'en', {
            orderNumber: 'A-1',
            total: '100',
        });
        expect(result.subject).toBe('Order A-1');
        expect(result.body).toBe('Total 100');
    });

    it('renderByKey бросает NotFound для неизвестного ключа', async () => {
        repo.findByKey.mockResolvedValue(null);
        await expect(service.renderByKey('missing', 'ru', {})).rejects.toBeInstanceOf(
            NotFoundException,
        );
    });

    it('renderByKey бросает NotFound для неактивного шаблона', async () => {
        repo.findByKey.mockResolvedValue(makeTemplate({ isActive: false }));
        await expect(service.renderByKey('auth.otp', 'ru', { code: '1' })).rejects.toBeInstanceOf(
            NotFoundException,
        );
    });

    it('renderByKey нормализует невалидный lang к DEFAULT_LANG', async () => {
        repo.findByKey.mockResolvedValue(makeTemplate());
        const result = await service.renderByKey('auth.otp', 'fr', { code: '9' });
        // DEFAULT_LANG === 'hy' → армянский текст
        expect(DEFAULT_LANG).toBe('hy');
        expect(result.body).toBe('BRICK կոդ՝ 9');
    });

    it('getByKey возвращает активный шаблон', async () => {
        repo.findByKey.mockResolvedValue(makeTemplate());
        const tpl = await service.getByKey('auth.otp');
        expect(tpl.key).toBe('auth.otp');
    });

    it('updateByKey поднимает версию', async () => {
        repo.findByKey.mockResolvedValue(makeTemplate({ version: 3 }));
        repo.updateById.mockResolvedValue(makeTemplate({ version: 4, name: 'New' }));
        const tpl = await service.updateByKey('auth.otp', { name: 'New' });
        expect(repo.updateById).toHaveBeenCalledWith('t1', { name: 'New', version: 4 });
        expect(tpl.version).toBe(4);
    });

    it('updateByKey бросает NotFound, если шаблона нет', async () => {
        repo.findByKey.mockResolvedValue(null);
        await expect(service.updateByKey('x', {})).rejects.toBeInstanceOf(NotFoundException);
    });

    it('removeByKey удаляет по найденному id', async () => {
        repo.findByKey.mockResolvedValue(makeTemplate());
        repo.deleteById.mockResolvedValue(true);
        await service.removeByKey('auth.otp');
        expect(repo.deleteById).toHaveBeenCalledWith('t1');
    });

    it('onModuleInit создаёт отсутствующие дефолтные шаблоны', async () => {
        repo.findByKey.mockResolvedValue(null);
        repo.create.mockResolvedValue(makeTemplate());
        await service.onModuleInit();
        expect(repo.create).toHaveBeenCalled();
    });

    it('onModuleInit пропускает существующие шаблоны', async () => {
        repo.findByKey.mockResolvedValue(makeTemplate());
        await service.onModuleInit();
        expect(repo.create).not.toHaveBeenCalled();
    });

    it('onModuleInit не падает при ошибке Mongo', async () => {
        repo.findByKey.mockRejectedValue(new Error('no mongo'));
        await expect(service.onModuleInit()).resolves.toBeUndefined();
    });
});
