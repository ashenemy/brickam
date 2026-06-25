import type { AppConfigService } from '@brickam/config-kit';
import { describe, expect, it } from 'vitest';
import { createEmailChannel } from './email-channel.factory';
import { MockEmailChannel } from './mock-email.channel';
import { SesEmailChannel } from './ses-email.channel';

const makeConfig = (
    email: string,
    secrets: Record<string, string | undefined> = {},
): AppConfigService =>
    ({
        providers: { email },
        secrets,
    }) as unknown as AppConfigService;

describe('createEmailChannel', () => {
    it('providers.email=ses + emailFrom → SesEmailChannel', () => {
        const channel = createEmailChannel(
            makeConfig('ses', { emailFrom: 'no-reply@brickam.app', sesRegion: 'eu-central-1' }),
        );
        expect(channel).toBeInstanceOf(SesEmailChannel);
    });

    it('providers.email=ses без emailFrom → mock (фолбэк)', () => {
        const channel = createEmailChannel(makeConfig('ses', {}));
        expect(channel).toBeInstanceOf(MockEmailChannel);
    });

    it('providers.email=mock → MockEmailChannel', () => {
        const channel = createEmailChannel(makeConfig('mock', { emailFrom: 'x@y.z' }));
        expect(channel).toBeInstanceOf(MockEmailChannel);
    });
});
