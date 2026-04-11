import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// ============================================================
// Configuration
// ============================================================

function getS3Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) {
    throw new Error('R2_ACCOUNT_ID environment variable is required');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
  });
}

function getBucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error('R2_BUCKET_NAME environment variable is required');
  }
  return bucket;
}

function getPublicUrl(): string {
  return process.env.R2_PUBLIC_URL || '';
}

// ============================================================
// Upload Service
// ============================================================

export class UploadService {
  private client: S3Client | null = null;

  private getClient(): S3Client {
    if (!this.client) {
      this.client = getS3Client();
    }
    return this.client;
  }

  /**
   * Generate a unique storage key for a file.
   * Format: folder/uuid/filename-uuid.ext
   * Example: properties/abc-123/image-def-456.jpg
   */
  generateKey(folder: string, filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const baseName = path
      .basename(filename, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50);
    const fileId = uuidv4();
    return `${folder}/${baseName}-${fileId}${ext}`;
  }

  /**
   * Upload a file buffer to R2.
   * Returns the public URL of the uploaded file.
   */
  async uploadFile(
    file: Buffer,
    key: string,
    contentType: string,
  ): Promise<{ key: string; url: string; size: number }> {
    const client = this.getClient();
    const bucket = getBucketName();

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
      }),
    );

    const publicUrl = getPublicUrl();
    const url = publicUrl ? `${publicUrl}/${key}` : key;

    return {
      key,
      url,
      size: file.length,
    };
  }

  /**
   * Delete a file from R2.
   */
  async deleteFile(key: string): Promise<void> {
    const client = this.getClient();
    const bucket = getBucketName();

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  }

  /**
   * Generate a presigned URL for temporary access to a file.
   * @param key Storage key
   * @param expiresIn Seconds until URL expires (default 3600 = 1 hour)
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const client = this.getClient();
    const bucket = getBucketName();

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return awsGetSignedUrl(client, command, { expiresIn });
  }

  /**
   * Validate file type against allowed MIME types.
   */
  validateFileType(mimeType: string, allowedTypes: string[]): boolean {
    return allowedTypes.some(allowed => {
      if (allowed.endsWith('/*')) {
        const prefix = allowed.slice(0, -2);
        return mimeType.startsWith(prefix);
      }
      return mimeType === allowed;
    });
  }
}

export const uploadService = new UploadService();

// ============================================================
// Allowed MIME types per upload category
// ============================================================

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

export const ALLOWED_RECEIPT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

// Max file sizes in bytes
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;       // 10 MB
export const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024;     // 25 MB
export const MAX_RECEIPT_SIZE = 10 * 1024 * 1024;       // 10 MB
