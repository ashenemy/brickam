import type { AppConfigService } from '@brickam/config-kit';
import { Logger } from '@nestjs/common';
import type { EmailChannel } from './email.channel';
import { MockEmailChannel } from './mock-email.channel';
import { SesEmailChannel } from './ses-email.channel';

/**
 * Выбирает реализацию Email-канала по конфигу: `providers.email === 'ses'` и
 * заданный `emailFrom` → реальный SES (регион из `sesRegion`/`s3Region`/дефолт,
 * креды — из default credential chain / IAM-роли ECS); иначе — mock (с warn,
 * если 'ses' выбран, но `emailFrom` не задан). Чистая функция для useFactory и
 * для тестов.
 */
export function createEmailChannel(config: AppConfigService): EmailChannel {
    if (config.providers.email === 'ses') {
        const { emailFrom, sesRegion, s3Region } = config.secrets;
        if (emailFrom) {
            return new SesEmailChannel({
                region: sesRegion ?? s3Region ?? 'us-east-1',
                from: emailFrom,
            });
        }
        new Logger('Email').warn(
            'providers.email=ses, но EMAIL_FROM не задан — используется mock-канал',
        );
    }
    return new MockEmailChannel();
}
