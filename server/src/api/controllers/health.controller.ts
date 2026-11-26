import { Request, Response } from 'express';
import { checkDatabaseHealth } from '../../config/db.js';
import { checkRedisHealth } from '../../config/redis.js';
import { storageService } from '../../services/storage.service.js';
import { emailService } from '../../services/email.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

const START_TIME = Date.now();

export async function healthCheckController(_req: Request, res: Response): Promise<void> {
  const [databaseHealthy, redisHealthy, storageHealthy, smtpHealthy] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    storageService.checkStorageHealth(),
    emailService.checkSmtpHealth(),
  ]);

  const allHealthy = databaseHealthy && redisHealthy && storageHealthy && smtpHealthy;
  const uptimeSeconds = Math.floor((Date.now() - START_TIME) / 1000);

  const payload = {
    status: allHealthy ? 'healthy' : 'degraded',
    version: '1.0.0',
    uptimeSeconds,
    timestamp: new Date().toISOString(),
    services: {
      database: databaseHealthy,
      redis: redisHealthy,
      storage: storageHealthy,
      smtp: smtpHealthy,
    },
  };

  if (allHealthy) {
    sendSuccess(res, payload, 'All system services operational.', 200);
  } else {
    // Per requirements: Return 503 if any dependency is unhealthy
    sendError(
      res,
      'SERVICE_UNAVAILABLE',
      'One or more system services are unhealthy.',
      503,
      [payload],
    );
  }
}
