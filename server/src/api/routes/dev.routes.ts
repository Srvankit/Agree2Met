import { Router, Request, Response } from 'express';
import { enqueueTransactionalEmail } from '../../queues/index.js';
import { emailService } from '../../services/email.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

const router = Router();

// Dev-only route to enqueue a test email
router.post('/dev/test-email', async (req: Request, res: Response): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    sendError(res, 'NOT_FOUND', 'Cannot POST /api/v1/dev/test-email', 404);
    return;
  }

  const { to = 'test.recipient@example.com', subject = 'Agree2Met Verification Email Test' } =
    req.body || {};

  const html = emailService.getBaseHtmlTemplate(
    'Phase 1 Test Notification',
    `
    <p>Hello,</p>
    <p>This is a real test email generated during Phase 1 foundation verification.</p>
    <p>Queue: <strong>transactional-email-queue</strong></p>
    <p>Timestamp: <code>${new Date().toISOString()}</code></p>
    <p><a href="http://localhost:5173" class="button">Visit Agree2Met Platform</a></p>
    `,
  );

  const job = await enqueueTransactionalEmail({
    to,
    subject,
    html,
    text: `Hello, this is a real test email generated during Phase 1 foundation verification at ${new Date().toISOString()}.`,
  });

  sendSuccess(
    res,
    {
      jobId: job.id,
      queue: 'transactional-email-queue',
      to,
      subject,
      enqueuedAt: new Date().toISOString(),
    },
    'Test email successfully enqueued for delivery.',
    200,
  );
});

export const devRoutes = router;
