import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import { getEnv } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { validateResumeName } from '../utils/validators.js';
import {
  allowedDocumentMimeTypes,
  getUploadRoot,
  sanitizeOriginalName,
  validateDocumentFile
} from '../utils/fileValidation.js';

const storage = multer.memoryStorage();

function fileFilter(_req, file, callback) {
  if (!allowedDocumentMimeTypes.has(file.mimetype)) {
    callback(new AppError('Only PDF, DOCX, JPG, JPEG, and PNG files are accepted', 415, 'UNSUPPORTED_FILE_TYPE'));
    return;
  }
  callback(null, true);
}

export const uploadResume = asyncHandler(async (req, _res, next) => {
  const { maximumUploadBytes } = getEnv();
  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maximumUploadBytes,
      files: 1,
      fields: 10,
      parts: 12,
      fieldSize: 4096
    }
  }).single('file');

  upload(req, _res, async (error) => {
    if (error) {
      next(error);
      return;
    }
    if (!req.file) {
      next(new AppError('A document file is required', 400, 'FILE_REQUIRED'));
      return;
    }
    try {
      const validatedBody = validateResumeName(req.body);
      const validated = await validateDocumentFile(req.file);
      const uploadRoot = getUploadRoot();
      await fs.mkdir(uploadRoot, { recursive: true, mode: 0o700 });
      const storageName = `${crypto.randomUUID()}${validated.extension}`;
      const filePath = path.resolve(uploadRoot, storageName);
      if (path.dirname(filePath) !== uploadRoot) {
        throw new AppError('Unable to store the uploaded file safely', 500, 'FILE_STORAGE_ERROR');
      }
      await fs.writeFile(filePath, req.file.buffer, { flag: 'wx', mode: 0o600 });
      req.file.storageName = storageName;
      req.file.validatedMimeType = validated.mimeType;
      req.file.originalName = sanitizeOriginalName(req.file.originalname);
      req.validated = { ...(req.validated || {}), body: validatedBody };
      next();
    } catch (uploadError) {
      next(uploadError);
    }
  });
});
