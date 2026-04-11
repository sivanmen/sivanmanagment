import { Request, Response, NextFunction } from 'express';
import {
  uploadService,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_RECEIPT_TYPES,
  MAX_IMAGE_SIZE,
  MAX_DOCUMENT_SIZE,
  MAX_RECEIPT_SIZE,
} from './upload.service';
import { ApiError } from '../../utils/api-error';
import { sendSuccess } from '../../utils/response';

export class UploadsController {
  /**
   * POST /api/v1/uploads/images
   * Upload one or more property images.
   * Expects multipart/form-data with field "files" (array) or "file" (single).
   */
  async uploadImages(req: Request, res: Response, next: NextFunction) {
    try {
      const files = this.extractFiles(req);
      if (files.length === 0) {
        throw ApiError.badRequest('No files provided', 'NO_FILES');
      }

      const results = [];

      for (const file of files) {
        // Validate type
        if (!uploadService.validateFileType(file.mimetype, ALLOWED_IMAGE_TYPES)) {
          throw ApiError.badRequest(
            `Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
            'INVALID_FILE_TYPE',
          );
        }

        // Validate size
        if (file.size > MAX_IMAGE_SIZE) {
          throw ApiError.badRequest(
            `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
            'FILE_TOO_LARGE',
          );
        }

        const key = uploadService.generateKey('images', file.originalname);
        const result = await uploadService.uploadFile(file.buffer, key, file.mimetype);
        results.push({
          ...result,
          originalName: file.originalname,
          mimeType: file.mimetype,
        });
      }

      sendSuccess(res, results, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/uploads/documents
   * Upload a document (PDF, DOC, XLS, etc.).
   */
  async uploadDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const files = this.extractFiles(req);
      if (files.length === 0) {
        throw ApiError.badRequest('No files provided', 'NO_FILES');
      }

      const results = [];

      for (const file of files) {
        if (!uploadService.validateFileType(file.mimetype, ALLOWED_DOCUMENT_TYPES)) {
          throw ApiError.badRequest(
            `Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`,
            'INVALID_FILE_TYPE',
          );
        }

        if (file.size > MAX_DOCUMENT_SIZE) {
          throw ApiError.badRequest(
            `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: ${MAX_DOCUMENT_SIZE / 1024 / 1024}MB`,
            'FILE_TOO_LARGE',
          );
        }

        const key = uploadService.generateKey('documents', file.originalname);
        const result = await uploadService.uploadFile(file.buffer, key, file.mimetype);
        results.push({
          ...result,
          originalName: file.originalname,
          mimeType: file.mimetype,
        });
      }

      sendSuccess(res, results, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/uploads/receipts
   * Upload an expense receipt (image or PDF).
   */
  async uploadReceipts(req: Request, res: Response, next: NextFunction) {
    try {
      const files = this.extractFiles(req);
      if (files.length === 0) {
        throw ApiError.badRequest('No files provided', 'NO_FILES');
      }

      const results = [];

      for (const file of files) {
        if (!uploadService.validateFileType(file.mimetype, ALLOWED_RECEIPT_TYPES)) {
          throw ApiError.badRequest(
            `Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_RECEIPT_TYPES.join(', ')}`,
            'INVALID_FILE_TYPE',
          );
        }

        if (file.size > MAX_RECEIPT_SIZE) {
          throw ApiError.badRequest(
            `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: ${MAX_RECEIPT_SIZE / 1024 / 1024}MB`,
            'FILE_TOO_LARGE',
          );
        }

        const key = uploadService.generateKey('receipts', file.originalname);
        const result = await uploadService.uploadFile(file.buffer, key, file.mimetype);
        results.push({
          ...result,
          originalName: file.originalname,
          mimeType: file.mimetype,
        });
      }

      sendSuccess(res, results, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/uploads/:key(*)
   * Delete a file from storage.
   */
  async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      // The key can contain slashes, captured via wildcard param
      const key = (req.params.key || req.params[0]) as string;
      if (!key) {
        throw ApiError.badRequest('File key is required', 'MISSING_KEY');
      }

      await uploadService.deleteFile(key as string);
      sendSuccess(res, { message: 'File deleted successfully', key });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Extract multer files from the request.
   * Supports both single file (req.file) and multiple files (req.files).
   */
  private extractFiles(req: Request): Express.Multer.File[] {
    if (req.files) {
      if (Array.isArray(req.files)) {
        return req.files;
      }
      // req.files is a record keyed by field name
      const allFiles: Express.Multer.File[] = [];
      for (const fieldFiles of Object.values(req.files)) {
        allFiles.push(...fieldFiles);
      }
      return allFiles;
    }
    if (req.file) {
      return [req.file];
    }
    return [];
  }
}

export const uploadsController = new UploadsController();
