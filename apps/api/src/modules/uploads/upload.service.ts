/**
 * Upload Service — Cloudflare R2 (S3-compatible) file storage.
 *
 * Hardened 2026-05-25:
 *   - Reads config from the central `config` module (not process.env directly).
 *   - Graceful degradation: returns ApiError.serviceUnavailable when R2 is not
 *     configured, instead of crashing the request.
 *   - Exposes `isConfigured()` for health checks and the status page.
 *   - Supports an explicit `R2_ENDPOINT` override (default: derived from accountId).
 */
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { config } from '../../config';
import { ApiError } from '../../utils/api-error';

function deriveEndpoint(): string {
  if (config.storage.endpoint) return config.storage.endpoint;
  if (!config.storage.accountId) return '';
  return `https://${config.storage.accountId}.r2.cloudflarestorage.com`;
}

export class UploadService {
  private client: S3Client | null = null;

  isConfigured(): boolean {
    return Boolean(
      config.storage.accountId &&
        config.storage.accessKeyId &&
        config.storage.secretAccessKey &&
        config.storage.bucketName,
    );
  }

  private requireConfigured(): void {
    if (!this.isConfigured()) {
      throw ApiError.serviceUnavailable(
        'File storage (Cloudflare R2) is not configured. Required env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME.',
        'STORAGE_NOT_CONFIGURED',
      );
    }
  }

  private getClient(): S3Client {
    this.requireConfigured();
    if (!this.client) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: deriveEndpoint(),
        credentials: {
          accessKeyId: config.storage.accessKeyId,
          secretAccessKey: config.storage.secretAccessKey,
        },
      });
    }
    return this.client;
  }

  /**
   * Health check — lightweight HEAD on the bucket. Returns true if R2 is
   * reachable, false otherwise. Used by /api/v1/health/deep and /status.
   */
  async ping(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
    if (!this.isConfigured()) {
      return { ok: false, error: 'not_configured' };
    }
    const start = Date.now();
    try {
      const client = this.getClient();
      await client.send(new HeadBucketCommand({ Bucket: config.storage.bucketName }));
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err: any) {
      return { ok: false, latencyMs: Date.now() - start, error: err.message ?? 'unknown' };
    }
  }

  /**
   * Generate a unique storage key for a file.
   * Format: folder/baseName-uuid.ext
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
   * Upload a file buffer to R2. Throws ApiError if storage is not configured.
   */
  async uploadFile(
    file: Buffer,
    key: string,
    contentType: string,
  ): Promise<{ key: string; url: string; size: number; isPublic: boolean }> {
    const client = this.getClient();

    await client.send(
      new PutObjectCommand({
        Bucket: config.storage.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
      }),
    );

    const publicUrl = config.storage.publicUrl;
    const url = publicUrl ? `${publicUrl}/${key}` : key;

    return {
      key,
      url,
      size: file.length,
      isPublic: Boolean(publicUrl),
    };
  }

  async deleteFile(key: string): Promise<void> {
    const client = this.getClient();
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.storage.bucketName,
        Key: key,
      }),
    );
  }

  /**
   * Generate a presigned URL for temporary access to a private file.
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const client = this.getClient();
    const command = new GetObjectCommand({
      Bucket: config.storage.bucketName,
      Key: key,
    });
    return awsGetSignedUrl(client, command, { expiresIn });
  }

  validateFileType(mimeType: string, allowedTypes: string[]): boolean {
    return allowedTypes.some((allowed) => {
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
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024; // 25 MB
export const MAX_RECEIPT_SIZE = 10 * 1024 * 1024; // 10 MB
