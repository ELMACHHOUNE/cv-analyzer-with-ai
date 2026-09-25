import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { AppError } from './AppError.js';

function resolveJwtConfig(options = {}) {
  const secret = options.secret ?? process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters');
  }
  return {
    secret,
    expiresIn: options.expiresIn ?? process.env.JWT_EXPIRES_IN ?? '7d',
    issuer: 'jadara-cv-analyzer',
    audience: 'jadara-cv-analyzer-client'
  };
}

export function signAccessToken(user, options = {}) {
  const config = resolveJwtConfig(options);
  return jwt.sign(
    { ver: user.tokenVersion ?? 0 },
    config.secret,
    {
      algorithm: 'HS256',
      audience: config.audience,
      expiresIn: config.expiresIn,
      issuer: config.issuer,
      jwtid: crypto.randomUUID(),
      subject: user._id.toString()
    }
  );
}

export function verifyAccessToken(token, options = {}) {
  const config = resolveJwtConfig(options);
  try {
    return jwt.verify(token, config.secret, {
      algorithms: ['HS256'],
      audience: config.audience,
      issuer: config.issuer
    });
  } catch {
    throw new AppError('Authentication token is invalid or expired', 401, 'INVALID_TOKEN');
  }
}
