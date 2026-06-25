import { StorageServiceContract } from '@brickam/domain-kit';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { describe, expect, it } from 'vitest';
import { StorageModule } from './storage.module';
import { StorageProvider } from './storage.provider';

type ExistingProvider = { provide: unknown; useExisting?: unknown };

describe('StorageModule', () => {
    it('биндит StorageServiceContract как useExisting на StorageProvider и экспортирует его', () => {
        const providers = (Reflect.getMetadata(MODULE_METADATA.PROVIDERS, StorageModule) ??
            []) as ExistingProvider[];
        const exportsMeta = (Reflect.getMetadata(MODULE_METADATA.EXPORTS, StorageModule) ??
            []) as unknown[];

        const contractBinding = providers.find((p) => p.provide === StorageServiceContract);

        expect(contractBinding).toBeDefined();
        // Контракт указывает на ту же реализацию, что и StorageProvider (single instance).
        expect(contractBinding?.useExisting).toBe(StorageProvider);
        expect(exportsMeta).toContain(StorageServiceContract);
    });
});
