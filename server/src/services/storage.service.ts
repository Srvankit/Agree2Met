import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketAclCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { Readable } from 'stream';

export class StorageService {
  private client: S3Client;
  private bucket: string;
  private bucketChecked: boolean = false;

  constructor() {
    this.bucket = env.STORAGE_BUCKET;
    const protocol = env.STORAGE_USE_SSL ? 'https' : 'http';
    const endpoint = `${protocol}://${env.STORAGE_ENDPOINT}:${env.STORAGE_PORT}`;

    this.client = new S3Client({
      endpoint,
      region: env.STORAGE_REGION,
      credentials: {
        accessKeyId: env.STORAGE_ACCESS_KEY,
        secretAccessKey: env.STORAGE_SECRET_KEY,
      },
      forcePathStyle: true, // Crucial for S3-compatible local services (MinIO, Zenko)
    });
  }

  public async ensureBucket(): Promise<void> {
    if (this.bucketChecked) return;
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.bucketChecked = true;
    } catch (err: any) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        logger.info(`Bucket '${this.bucket}' not found. Creating private bucket...`);
        try {
          await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
          // Ensure private ACL
          try {
            await this.client.send(
              new PutBucketAclCommand({ Bucket: this.bucket, ACL: 'private' }),
            );
          } catch {
            // Ignore if ACL command is unsupported on mock server
          }
          this.bucketChecked = true;
          logger.info(`Private bucket '${this.bucket}' created successfully.`);
        } catch (createErr) {
          logger.error({ createErr }, `Failed to create bucket '${this.bucket}'`);
          throw createErr;
        }
      } else {
        logger.error({ err }, `Error checking bucket '${this.bucket}'`);
      }
    }
  }

  public async putObject(
    key: string,
    data: Buffer | Uint8Array | string,
    contentType: string = 'application/octet-stream',
  ): Promise<void> {
    await this.ensureBucket();
    const body = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: 'private',
    });
    await this.client.send(command);
  }

  public async getObject(key: string): Promise<Buffer> {
    await this.ensureBucket();
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const response = await this.client.send(command);

    if (!response.Body) {
      throw new Error(`Empty body returned for object key: ${key}`);
    }

    const stream = response.Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
  }

  public async deleteObject(key: string): Promise<void> {
    await this.ensureBucket();
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.client.send(command);
  }

  public async getPresignedUrl(key: string, expiresInSeconds: number = 300): Promise<string> {
    await this.ensureBucket();
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  public async getPresignedUploadUrl(
    key: string,
    expiresInSeconds: number = 300,
    contentType: string = 'application/octet-stream',
  ): Promise<string> {
    await this.ensureBucket();
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ACL: 'private',
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  public async checkStorageHealth(): Promise<boolean> {
    try {
      await this.ensureBucket();
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return true;
    } catch (error) {
      logger.error({ error }, 'Storage health check failed');
      return false;
    }
  }
}

export const storageService = new StorageService();
