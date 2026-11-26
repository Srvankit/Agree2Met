import { createEmailWorker } from './email.worker.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../config/db.js';
import { redis } from '../config/redis.js';
import { closeQueues } from '../queues/index.js';

logger.info('Initializing Agree2Met background worker runtime...');

const emailWorker = createEmailWorker();

async function handleShutdown(signal: string) {
  logger.info(`Received ${signal}. Shutting down worker process gracefully...`);
  try {
    await emailWorker.close();
    await closeQueues();
    await prisma.$disconnect();
    await redis.quit();
    logger.info('Worker process shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during worker graceful shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
