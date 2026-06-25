import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';

describe('SeoController', () => {
    let controller: SeoController;
    const seoService = {
        generateSitemap: vi.fn(async () => '<urlset></urlset>'),
        generateRobots: vi.fn(() => 'User-agent: *\nSitemap: https://x/api/sitemap.xml'),
    };

    beforeEach(async () => {
        seoService.generateSitemap.mockClear();
        seoService.generateRobots.mockClear();
        const moduleRef: TestingModule = await Test.createTestingModule({
            controllers: [SeoController],
            providers: [{ provide: SeoService, useValue: seoService }],
        }).compile();
        controller = moduleRef.get(SeoController);
    });

    it('sitemap() делегирует SeoService.generateSitemap', async () => {
        const xml = await controller.sitemap();
        expect(xml).toBe('<urlset></urlset>');
        expect(seoService.generateSitemap).toHaveBeenCalledTimes(1);
    });

    it('robots() делегирует SeoService.generateRobots', () => {
        const robots = controller.robots();
        expect(robots).toContain('Sitemap:');
        expect(seoService.generateRobots).toHaveBeenCalledTimes(1);
    });

    it('sitemap.xml помечен Content-Type application/xml', () => {
        const headers = Reflect.getMetadata('__headers__', controller.sitemap) as
            | { name: string; value: string }[]
            | undefined;
        expect(headers).toEqual([{ name: 'Content-Type', value: 'application/xml' }]);
    });

    it('robots.txt помечен Content-Type text/plain', () => {
        const headers = Reflect.getMetadata('__headers__', controller.robots) as
            | { name: string; value: string }[]
            | undefined;
        expect(headers).toEqual([{ name: 'Content-Type', value: 'text/plain' }]);
    });
});
