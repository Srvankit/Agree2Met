import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis.js';
import { TRANSACTIONAL_EMAIL_QUEUE } from '../queues/index.js';
import { emailService, EmailOptions } from '../services/email.service.js';
import { logger } from '../utils/logger.js';

export function createEmailWorker(): Worker<EmailOptions> {
  const worker = new Worker<EmailOptions>(
    TRANSACTIONAL_EMAIL_QUEUE,
    async (job: Job<EmailOptions>) => {
      logger.info({ jobId: job.id, to: job.data.to, subject: job.data.subject }, 'Processing email job');
      const result = await emailService.sendEmail(job.data);
      return result;
    },
    {
      connection: redis,
      concurrency: 5,
    },
  );

  worker.on('completed', (job: Job<EmailOptions>) => {
    logger.info({ jobId: job.id }, 'Email job completed successfully');
  });

  worker.on('failed', (job: Job<EmailOptions> | undefined, error: Error) => {
    logger.error({ jobId: job?.id, error }, 'Email job failed');
  });

  return worker;
}
