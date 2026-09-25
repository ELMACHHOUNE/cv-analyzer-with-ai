import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import mammoth from 'mammoth';
import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { AppError } from '../utils/AppError.js';
import { getStoragePath } from '../utils/fileValidation.js';
import { cleanOcrText, recognizeImage } from './ocrService.js';

const maximumPdfPages = 50;
const maximumOcrPages = 20;
const maximumExtractedCharacters = 300000;

function cleanExtractedText(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .replace(/[\u200b-\u200d\u2060\ufeff]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maximumExtractedCharacters);
}

function hasUsableText(value) {
  const text = cleanExtractedText(value);
  const tokens = text.match(/[\p{L}\p{N}][\p{L}\p{N}@.+#/-]*/gu) || [];
  const uniqueRatio = tokens.length ? new Set(tokens.map((token) => token.toLowerCase())).size / tokens.length : 0;
  const characterRatio = text.length ? (text.match(/[\p{L}\p{N}\s@.+#/-]/gu) || []).length / text.length : 0;
  return text.length >= 40 && tokens.length >= 8 && characterRatio >= 0.7 && (tokens.length >= 20 || uniqueRatio >= 0.18);
}

function requireText(value) {
  const text = cleanExtractedText(value);
  if (!hasUsableText(text)) {
    throw new AppError('The document does not contain enough readable text', 422, 'DOCUMENT_TEXT_EMPTY');
  }
  return text;
}

async function openPdf(buffer) {
  const task = getDocument({
    data: new Uint8Array(buffer),
    disableFontFace: true,
    enableXfa: false,
    maxImageSize: 40_000_000,
    stopAtErrors: true,
    useSystemFonts: false
  });
  const document = await task.promise;
  if (document.numPages < 1 || document.numPages > maximumPdfPages) {
    await document.destroy();
    throw new AppError(`PDF documents must contain between 1 and ${maximumPdfPages} pages`, 422, 'INVALID_PDF');
  }
  return document;
}

async function extractPdfText(document) {
  const pages = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    let pageText = '';
    for (const item of content.items) {
      if (typeof item.str !== 'string') continue;
      pageText += item.str;
      pageText += item.hasEOL ? '\n' : ' ';
    }
    pages.push(pageText);
    page.cleanup();
  }
  return requireText(pages.join('\n'));
}

async function renderPdfPage(document, pageNumber) {
  const page = await document.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = Math.min(2.5, Math.max(1.5, 1800 / Math.max(baseViewport.width, baseViewport.height)));
  const viewport = page.getViewport({ scale });
  const width = Math.max(1, Math.ceil(viewport.width));
  const height = Math.max(1, Math.ceil(viewport.height));
  if (width * height > 18_000_000) {
    await page.cleanup();
    throw new AppError('A PDF page is too large to rasterize safely', 422, 'INVALID_PDF');
  }
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  await page.render({
    canvas,
    canvasContext: context,
    viewport,
    background: 'rgb(255,255,255)'
  }).promise;
  const image = canvas.toBuffer('image/png');
  page.cleanup();
  return image;
}

async function extractPdfWithOcr(document) {
  if (document.numPages > maximumOcrPages) {
    throw new AppError('This scanned PDF has too many pages for automatic OCR', 422, 'OCR_PAGE_LIMIT');
  }
  const pages = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const image = await renderPdfPage(document, pageNumber);
    pages.push(await recognizeImage(image));
  }
  return requireText(pages.join('\n'));
}

async function extractPdf(buffer) {
  let document;
  try {
    document = await openPdf(buffer);
    const text = await extractPdfText(document);
    return { text, pageCount: document.numPages, extractionMethod: 'pdf-text' };
  } catch (error) {
    if (error instanceof AppError && error.code !== 'DOCUMENT_TEXT_EMPTY') {
      throw error;
    }
    if (!document) {
      try {
        document = await openPdf(buffer);
      } catch {
        throw new AppError('The PDF is malformed or cannot be read', 422, 'INVALID_PDF');
      }
    }
    const text = await extractPdfWithOcr(document);
    return { text, pageCount: document.numPages, extractionMethod: 'pdf-ocr' };
  } finally {
    if (document) {
      await document.destroy().catch(() => {});
    }
  }
}

async function extractDocx(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return { text: requireText(result.value), pageCount: 0, extractionMethod: 'docx-text' };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('The DOCX document is malformed or cannot be read', 422, 'INVALID_DOCX');
  }
}

async function extractImage(buffer) {
  const text = requireText(cleanOcrText(await recognizeImage(buffer)));
  return { text, pageCount: 1, extractionMethod: 'image-ocr' };
}

export async function extractDocument({ storageName, mimeType }) {
  const filePath = getStoragePath(storageName);
  let buffer;
  try {
    buffer = await fs.readFile(filePath);
  } catch {
    throw new AppError('Stored document is unavailable', 404, 'FILE_NOT_FOUND');
  }
  let extraction;
  if (mimeType === 'application/pdf') {
    extraction = await extractPdf(buffer);
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    extraction = await extractDocx(filePath);
  } else if (mimeType === 'image/jpeg' || mimeType === 'image/png') {
    extraction = await extractImage(buffer);
  } else {
    throw new AppError('Stored document type is unsupported', 422, 'UNSUPPORTED_FILE_TYPE');
  }
  return {
    ...extraction,
    text: extraction.text,
    characterCount: extraction.text.length,
    wordCount: (extraction.text.match(/[\p{L}\p{N}]+/gu) || []).length,
    textHash: crypto.createHash('sha256').update(extraction.text).digest('hex')
  };
}

export async function removeStoredFile(storageName) {
  const filePath = getStoragePath(storageName);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}
