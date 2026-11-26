import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

declare global {
  // eslint-disable-next-line no-var
  var __redisClient: Redis | undefined;
}

export function createRedisClient(): Redis {
  if (!global.__redisClient) {
    global.__redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // Required for BullMQ
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true,
    });

    global.__redisClient.on('error', (err) => {
      logger.error({ err }, 'Redis client connection error');
    });
  }
  return global.__redisClient;
}

export const redis = createRedisClient();

export async function checkRedisHealth(): Promise<boolean> {
  try {
    if (redis.status === 'end') {
      return false;
    }
    if (redis.status === 'wait') {
      await redis.connect();
    } else if (redis.status === 'connecting' || redis.status === 'connect') {
      await new Promise<void>((resolve, reject) => {
        const onReady = () => {
          cleanup();
          resolve();
        };
        const onError = (err: Error) => {
          cleanup();
          reject(err);
        };
        const timer = setTimeout(() => {
          cleanup();
          resolve();
        }, 3000);
        function cleanup() {
          clearTimeout(timer);
          redis.removeListener('ready', onReady);
          redis.removeListener('error', onError);
        }
        redis.once('ready', onReady);
        redis.once('error', onError);
      });
    }
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch (error) {
    logger.error({ error }, 'Redis ping check failed');
    return false;
  }
}
