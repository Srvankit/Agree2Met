import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { EmailOptions } from '../services/email.service.js';

export const PDF_GENERATION_QUEUE = 'pdf-generation-queue';
export const TRANSACTIONAL_EMAIL_QUEUE = 'transactional-email-queue';
export const CRON_SCHEDULER_QUEUE = 'cron-scheduler-queue';

export const pdfGenerationQueue = new Queue(PDF_GENERATION_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export const transactionalEmailQueue = new Queue<EmailOptions>(TRANSACTIONAL_EMAIL_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: 200,
    removeOnFail: 1000,
  },
});

export const cronSchedulerQueue = new Queue(CRON_SCHEDULER_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
    removeOnComplete: 50,
  },
});

export async function enqueueTransactionalEmail(
  options: EmailOptions,
  jobName: string = 'send-transactional-email',
) {
  logger.info({ to: options.to, subject: options.subject }, 'Enqueuing transactional email');
  return transactionalEmailQueue.add(jobName, options);
}

export async function closeQueues(): Promise<void> {
  await Promise.allSettled([
    pdfGenerationQueue.close(),
    transactionalEmailQueue.close(),
    cronSchedulerQueue.close(),
  ]);
  logger.info('All BullMQ queues closed successfully');
}
