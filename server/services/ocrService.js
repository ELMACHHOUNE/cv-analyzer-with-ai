import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import { AppError } from '../utils/AppError.js';
import { getEnv } from '../config/env.js';

function cleanOcrText(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function recognizeImage(buffer) {
  let prepared;
  try {
    const source = sharp(buffer, { failOn: 'error', limitInputPixels: 40_000_000, sequentialRead: true });
    const metadata = await source.metadata();
    if (!['jpeg', 'png'].includes(metadata.format) || !metadata.width || !metadata.height) {
      throw new Error('Unsupported image');
    }
    prepared = await sharp(buffer, { failOn: 'error', limitInputPixels: 40_000_000 })
      .rotate()
      .flatten({ background: '#ffffff' })
      .grayscale()
      .normalize()
      .resize({ width: 2400, height: 3200, fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();
  } catch {
    throw new AppError('The image is malformed or has unsafe dimensions', 422, 'INVALID_IMAGE');
  }

  const { ocrLanguages } = getEnv();
  if (!/^[a-z]{2,3}(?:[+_-][a-z0-9-]+)*$/i.test(ocrLanguages)) {
    throw new Error('OCR_LANGUAGES is invalid');
  }
  let worker;
  try {
    worker = await createWorker(ocrLanguages, undefined, {
      logger: () => {},
      errorHandler: () => {}
    });
    const result = await worker.recognize(prepared, {}, { text: true });
    return cleanOcrText(result.data.text);
  } catch {
    throw new AppError('OCR could not process this document', 422, 'OCR_FAILED');
  } finally {
    if (worker) {
      await worker.terminate().catch(() => {});
    }
  }
}

export { cleanOcrText };
