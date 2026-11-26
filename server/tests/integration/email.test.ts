import { describe, it, expect } from 'vitest';
import { emailService } from '../../src/services/email.service.js';
import { transactionalEmailQueue } from '../../src/queues/index.js';
import { createEmailWorker } from '../../src/workers/email.worker.js';

describe('Email Service & BullMQ Worker Integration', () => {
  it('verifies SMTP connection health against Mailpit', async () => {
    const isHealthy = await emailService.checkSmtpHealth();
    expect(isHealthy).toBe(true);
  });

  it('enqueues an email job, processes it via worker, and confirms delivery in Mailpit', async () => {
    const testRecipient = `catcher-test-${Date.now()}@agree2met.local`;
    const testSubject = `Integration Test Email ${Date.now()}`;
    const testBody = 'Evidentiary email delivery verification via transactional queue.';

    // Start worker instance for test
    const worker = createEmailWorker();

    try {
      // 1. Enqueue job
      const job = await transactionalEmailQueue.add('test-email-job', {
        to: testRecipient,
        subject: testSubject,
        text: testBody,
        html: `<p>${testBody}</p>`,
      });

      expect(job.id).toBeDefined();

      // 2. Poll Mailpit API (port 8025) until email is delivered by worker
      let received: any = null;
      for (let attempt = 0; attempt < 25; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const res = await fetch('http://localhost:8025/api/v1/messages');
        const data = await res.json();
        received = data.messages?.find((msg: any) =>
          msg.To?.some((to: any) => to.Address === testRecipient),
        );
        if (received) break;
      }

      expect(received).toBeDefined();
      expect(received.Subject).toBe(testSubject);
    } finally {
      await worker.close();
    }
  });
});
