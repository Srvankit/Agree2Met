import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { requestIdMiddleware } from './api/middlewares/request-id.middleware.js';
import { globalRateLimiter } from './api/middlewares/rate-limiter.middleware.js';
import { csrfMiddleware } from './api/middlewares/csrf.middleware.js';
import { notFoundMiddleware } from './api/middlewares/not-found.middleware.js';
import { errorHandlerMiddleware } from './api/middlewares/error.middleware.js';
import { healthRoutes } from './api/routes/health.routes.js';
import { devRoutes } from './api/routes/dev.routes.js';
import { authRouter } from './api/routes/auth.routes.js';
import { userRouter } from './api/routes/user.routes.js';
import { organizationRouter } from './api/routes/organization.routes.js';

export function createApp(): Express {
  const app = express();

  // 1. Basic security headers
  app.use(helmet());

  // 2. CORS configuration restricted to configured client origin
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-CSRF-Token',
        'X-Request-Id',
        'X-Organization-ID',
      ],
    }),
  );

  // 3. Body parsers with strict size limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // 4. Request ID tracing
  app.use(requestIdMiddleware);

  // 5. Structured HTTP logging with sensitive data redaction
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === '/api/v1/health' || req.url === '/health',
      },
      customProps: (req) => ({
        requestId: (req as any).id,
      }),
    }),
  );

  // 6. Global rate limiting
  app.use(globalRateLimiter);

  // 7. CSRF protection (ADR-004)
  app.use(csrfMiddleware);

  // 8. API Routes
  app.use('/api/v1', healthRoutes);
  app.use('/health', healthRoutes); // root convenience alias
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/organizations', organizationRouter);

  // Dev routes mounted strictly in non-production environments
  if (env.NODE_ENV !== 'production') {
    app.use('/api/v1', devRoutes);
  }

  // 9. 404 & Central Error Handlers
  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}

export const app = createApp();
