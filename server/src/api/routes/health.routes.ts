import { Router } from 'express';
import { healthCheckController } from '../controllers/health.controller.js';

const router = Router();

// GET /api/v1/health (and /health)
router.get('/health', healthCheckController);

export const healthRoutes = router;
