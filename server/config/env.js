import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const serverRoot = fileURLToPath(new URL('../', import.meta.url));
const maximumUploadBytes = 10 * 1024 * 1024;

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function positiveInteger(name, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${name} must be an integer between 1 and ${maximum}`);
  }
  return value;
}

function parseOrigins(value, isProduction) {
  if (isProduction && !value?.trim()) {
    throw new Error('CORS_ORIGINS is required in production');
  }
  const source = value?.trim() || 'http://localhost:5173,http://localhost:3000';
  if (isProduction && source === '*') {
    throw new Error('CORS_ORIGINS must be an explicit allowlist in production');
  }
  const origins = source
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (!origins.length || (isProduction && origins.includes('*'))) {
    throw new Error('CORS_ORIGINS must contain at least one explicit origin');
  }
  const normalizedOrigins = [];
  for (const origin of origins) {
    const parsed = new URL(origin);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || (parsed.pathname !== '/' && parsed.pathname !== '') || parsed.search || parsed.hash) {
      throw new Error(`Invalid CORS origin: ${origin}`);
    }
    normalizedOrigins.push(parsed.origin);
  }
  return [...new Set(normalizedOrigins)];
}

function parseTrustProxy(value) {
  if (!value || value === 'false') {
    return false;
  }
  const hops = Number(value);
  if (!Number.isInteger(hops) || hops < 1 || hops > 10) {
    throw new Error('TRUST_PROXY must be false or an integer from 1 to 10');
  }
  return hops;
}

export function getEnv({ requireSecrets = true } = {}) {
  const nodeEnv = process.env.NODE_ENV?.trim() || 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }
  const isProduction = isProductionValue(nodeEnv);
  const mongoUri = requireSecrets ? required('MONGODB_URI') : process.env.MONGODB_URI?.trim() || null;
  if (mongoUri && !/^mongodb(?:\+srv)?:\/\//.test(mongoUri)) {
    throw new Error('MONGODB_URI must be a valid MongoDB connection string');
  }
  const jwtSecret = requireSecrets ? required('JWT_SECRET') : process.env.JWT_SECRET?.trim() || null;
  if (requireSecrets && jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters');
  }
  const configuredUploadBytes = positiveInteger('MAX_UPLOAD_BYTES', maximumUploadBytes, maximumUploadBytes);
  const configuredUploadDirectory = process.env.UPLOAD_DIR?.trim() || 'uploads';
  const uploadDirectory = path.resolve(serverRoot, configuredUploadDirectory);
  if (uploadDirectory === path.parse(uploadDirectory).root) {
    throw new Error('UPLOAD_DIR must not be the filesystem root');
  }
  return Object.freeze({
    nodeEnv,
    isProduction,
    port: positiveInteger('PORT', 5000, 65535),
    mongoUri,
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || '7d',
    corsOrigins: parseOrigins(process.env.CORS_ORIGINS, isProduction),
    uploadDirectory,
    maximumUploadBytes: configuredUploadBytes,
    ocrLanguages: process.env.OCR_LANGUAGES?.trim() || 'eng',
    trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
    authRateLimit: positiveInteger('AUTH_RATE_LIMIT', 20, 10000),
    aiRateLimit: positiveInteger('AI_RATE_LIMIT', 30, 10000)
  });
}

function isProductionValue(nodeEnv) {
  return nodeEnv === 'production';
}

export function getAiConfig() {
  const timeout = Number(process.env.XAI_TIMEOUT_MS || 90000);
  if (!Number.isInteger(timeout) || timeout < 1000 || timeout > 120000) {
    throw new Error('XAI_TIMEOUT_MS must be an integer between 1000 and 120000');
  }
  return Object.freeze({
    apiKey: process.env.XAI_API_KEY?.trim() || null,
    model: process.env.XAI_MODEL?.trim() || 'grok-4.6',
    timeoutMs: timeout,
    endpoint: 'https://api.x.ai/v1/responses'
  });
}

export function getServerRoot() {
  return serverRoot;
}
