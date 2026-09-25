import { describe, expect, it } from 'vitest';
import { getStoragePath, validateDocumentFile } from '../utils/fileValidation.js';

function file(buffer, mimetype, originalname = 'document') {
  return {
    buffer,
    size: buffer.length,
    mimetype,
    originalname
  };
}

describe('document validation', () => {
  it('accepts a PDF signature regardless of the client extension', async () => {
    const buffer = Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF');
    await expect(validateDocumentFile(file(buffer, 'application/pdf', 'resume.exe'))).resolves.toMatchObject({
      mimeType: 'application/pdf',
      extension: '.pdf'
    });
  });

  it('rejects a declared PDF with unrelated content', async () => {
    const buffer = Buffer.from('plain text pretending to be a PDF');
    await expect(validateDocumentFile(file(buffer, 'application/pdf'))).rejects.toMatchObject({
      statusCode: 422,
      code: 'INVALID_FILE_SIGNATURE'
    });
  });

  it('rejects empty and oversized uploads', async () => {
    await expect(validateDocumentFile(file(Buffer.alloc(0), 'application/pdf'))).rejects.toMatchObject({
      statusCode: 413
    });
    await expect(validateDocumentFile(file(Buffer.alloc(10 * 1024 * 1024 + 1), 'application/pdf'))).rejects.toMatchObject({
      statusCode: 413
    });
  });

  it('rejects path traversal storage references', () => {
    expect(() => getStoragePath('../outside.pdf')).toThrow();
    expect(() => getStoragePath('C:\\outside.pdf')).toThrow();
  });
});
