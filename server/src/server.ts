// Agree2Met HTTP Server Runtime (HMR/Watch verified)
import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { prisma } from './config/db.js';
import { redis } from './config/redis.js';
import { closeQueues } from './queues/index.js';

const server = app.listen(env.PORT, () => {
  logger.info(`Agree2Met Server running in [${env.NODE_ENV}] mode on http://localhost:${env.PORT}`);
  logger.info(`Health check available at http://localhost:${env.PORT}/api/v1/health`);
});

let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  // Close HTTP server to stop accepting new requests
  server.close(async () => {
    logger.info('HTTP server closed.');

    try {
      await closeQueues();
      await prisma.$disconnect();
      await redis.quit();
      logger.info('Database and Redis connections closed. Graceful shutdown complete.');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during graceful shutdown execution');
      process.exit(1);
    }
  });

  // Force shutdown after timeout if hanging
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
