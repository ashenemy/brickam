import * as http from 'node:http';
import * as https from 'node:https';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import * as AWSXRay from 'aws-xray-sdk-core';
import { openSegment } from 'aws-xray-sdk-express';
import type { NextFunction, Request, Response } from 'express';

/**
 * Трассировка AWS X-Ray (наблюдаемость, Stage 22). Активна ТОЛЬКО в проде и при
 * заданном `AWS_XRAY_DAEMON_ADDRESS` (sidecar xray-daemon в ECS-task-def). В
 * dev/тестах — прозрачный no-op (next без сегмента). Перехват исходящих HTTP/AWS
 * вызовов включается глобально, чтобы зависимые сервисы попадали в карту трасс.
 */
const xrayEnabled =
    process.env['NODE_ENV'] === 'production' && Boolean(process.env['AWS_XRAY_DAEMON_ADDRESS']);

const segmentHandler: ((req: Request, res: Response, next: NextFunction) => void) | null = (() => {
    if (!xrayEnabled) {
        return null;
    }
    const daemon = process.env['AWS_XRAY_DAEMON_ADDRESS'];
    if (daemon) {
        AWSXRay.setDaemonAddress(daemon);
    }
    // Исходящие вызовы (PSP, S3, SES) — как поддоменные сегменты трассы.
    AWSXRay.captureHTTPsGlobal(http, true);
    AWSXRay.captureHTTPsGlobal(https, true);
    return openSegment('Brickam');
})();

@Injectable()
export class XRayMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void {
        if (segmentHandler) {
            segmentHandler(req, res, next);
            return;
        }
        next();
    }
}
