import { describe, it, expect } from 'vitest';
import { storageService } from '../../src/services/storage.service.js';

describe('StorageService Integration (S3 / MinIO)', () => {
  const testKey = `test-phase1-${Date.now()}.txt`;
  const testContent = 'Phase 1 S3 storage verification payload';

  it('verifies storage health and bucket existence', async () => {
    const isHealthy = await storageService.checkStorageHealth();
    expect(isHealthy).toBe(true);
  });

  it('uploads, retrieves, presigns, and deletes an object in the private bucket', async () => {
    // 1. Put object
    await storageService.putObject(testKey, testContent, 'text/plain');

    // 2. Get object and verify content
    const retrievedBuffer = await storageService.getObject(testKey);
    expect(retrievedBuffer.toString('utf-8')).toBe(testContent);

    // 3. Generate presigned download URL
    const presignedUrl = await storageService.getPresignedUrl(testKey, 300);
    expect(presignedUrl).toContain('http://localhost:9000/agree2met-dev/' + testKey);
    expect(presignedUrl).toContain('X-Amz-Signature');

    // 4. Delete object
    await storageService.deleteObject(testKey);

    // 5. Verify deletion
    await expect(storageService.getObject(testKey)).rejects.toThrow();
  });
});
