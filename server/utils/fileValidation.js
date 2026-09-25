import path from 'node:path';
import yauzl from 'yauzl';
import { getServerRoot } from '../config/env.js';
import { AppError } from './AppError.js';

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png'
]);

const extensions = Object.freeze({
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/jpeg': '.jpg',
  'image/png': '.png'
});

function openZip(buffer) {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, {
      lazyEntries: true,
      validateEntrySizes: true,
      strictFileNames: true
    }, (error, zipFile) => {
      if (error) {
        reject(new AppError('The uploaded DOCX file is malformed', 422, 'INVALID_DOCUMENT'));
        return;
      }
      resolve(zipFile);
    });
  });
}

function inspectDocx(buffer) {
  return new Promise((resolve, reject) => {
    openZip(buffer).then((zipFile) => {
      const requiredEntries = new Set(['[Content_Types].xml', '_rels/.rels', 'word/document.xml']);
      let entryCount = 0;
      let totalUncompressedBytes = 0;
      let settled = false;

      const fail = (message) => {
        if (settled) return;
        settled = true;
        zipFile.close();
        reject(new AppError(message, 422, 'INVALID_DOCUMENT'));
      };

      zipFile.on('error', () => fail('The uploaded DOCX file is malformed'));
      zipFile.on('entry', (entry) => {
        entryCount += 1;
        totalUncompressedBytes += entry.uncompressedSize;
        const normalizedName = entry.fileName.replace(/\\/g, '/');
        const unsafePath = normalizedName.startsWith('/') || normalizedName.split('/').includes('..');
        const encrypted = (entry.generalPurposeBitFlag & 0x1) === 0x1;
        if (entryCount > 5000 || totalUncompressedBytes > 50 * 1024 * 1024 || unsafePath || encrypted) {
          fail('The uploaded DOCX file is unsafe or malformed');
          return;
        }
        requiredEntries.delete(normalizedName);
        if (normalizedName === 'word/document.xml' && entry.uncompressedSize > 10 * 1024 * 1024) {
          fail('The uploaded DOCX document content is too large');
          return;
        }
        zipFile.readEntry();
      });
      zipFile.on('end', () => {
        if (settled) return;
        if (requiredEntries.size) {
          fail('The uploaded file is not a valid DOCX document');
          return;
        }
        settled = true;
        resolve(true);
      });
      zipFile.readEntry();
    }).catch(reject);
  });
}

function detectPdf(buffer) {
  const prefix = buffer.subarray(0, Math.min(buffer.length, 1024)).toString('latin1');
  const suffix = buffer.subarray(Math.max(0, buffer.length - 4096)).toString('latin1');
  return prefix.includes('%PDF-') && suffix.includes('%%EOF');
}

function detectJpeg(buffer) {
  const start = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const end = buffer.length >= 2 && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9;
  return start && end;
}

function detectPng(buffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const start = buffer.length >= 24 && buffer.subarray(0, 8).equals(signature);
  const width = start ? buffer.readUInt32BE(16) : 0;
  const height = start ? buffer.readUInt32BE(20) : 0;
  return start && width > 0 && height > 0 && buffer.lastIndexOf(Buffer.from('IEND')) >= buffer.length - 32;
}

export async function validateDocumentFile(file) {
  if (!file || !Buffer.isBuffer(file.buffer)) {
    throw new AppError('A document file is required', 400, 'FILE_REQUIRED');
  }
  if (file.size < 1 || file.size !== file.buffer.length || file.size > 10 * 1024 * 1024) {
    throw new AppError('The uploaded file is empty or exceeds 10 MB', 413, 'INVALID_FILE_SIZE');
  }
  if (!allowedMimeTypes.has(file.mimetype)) {
    throw new AppError('Only PDF, DOCX, JPG, JPEG, and PNG files are accepted', 415, 'UNSUPPORTED_FILE_TYPE');
  }
  let detectedMimeType;
  if (file.mimetype === 'application/pdf') {
    detectedMimeType = detectPdf(file.buffer) ? file.mimetype : null;
  } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    detectedMimeType = file.buffer[0] === 0x50 && file.buffer[1] === 0x4b ? file.mimetype : null;
    if (detectedMimeType) {
      await inspectDocx(file.buffer);
    }
  } else if (file.mimetype === 'image/jpeg') {
    detectedMimeType = detectJpeg(file.buffer) ? file.mimetype : null;
  } else {
    detectedMimeType = detectPng(file.buffer) ? file.mimetype : null;
  }
  if (!detectedMimeType) {
    throw new AppError('The file content does not match its declared type', 422, 'INVALID_FILE_SIGNATURE');
  }
  return { mimeType: detectedMimeType, extension: extensions[detectedMimeType] };
}

export function sanitizeOriginalName(value) {
  const normalized = String(value || 'document')
    .replace(/[\\/\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized.slice(0, 255) || 'document';
}

export function getUploadRoot() {
  const configured = process.env.UPLOAD_DIR?.trim() || 'uploads';
  return path.resolve(getServerRoot(), configured);
}

export function getStoragePath(storageName) {
  if (typeof storageName !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(pdf|docx|jpg|png)$/i.test(storageName)) {
    throw new AppError('Stored file reference is invalid', 400, 'INVALID_FILE_REFERENCE');
  }
  const root = getUploadRoot();
  const filePath = path.resolve(root, storageName);
  if (path.dirname(filePath) !== root) {
    throw new AppError('Stored file reference is invalid', 400, 'INVALID_FILE_REFERENCE');
  }
  return filePath;
}

export const allowedDocumentMimeTypes = allowedMimeTypes;
