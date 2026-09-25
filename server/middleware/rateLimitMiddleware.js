import { rateLimit } from 'express-rate-limit';

function environmentLimit(name, fallback) {
  const value = Number(process.env[name] || fallback);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function limiter(limit, identifier) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    identifier,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }
  });
}

export const authLimiter = limiter(environmentLimit('AUTH_RATE_LIMIT', 20), 'auth');
export const aiLimiter = limiter(environmentLimit('AI_RATE_LIMIT', 30), 'ai');
