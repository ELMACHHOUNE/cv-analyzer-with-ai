import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';

export function createAuthMiddleware({ UserModel = User, tokenVerifier = verifyAccessToken } = {}) {
  return asyncHandler(async (req, _res, next) => {
    const authorization = req.get('authorization') || '';
    const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
    if (!match) {
      throw new AppError('Authentication is required', 401, 'AUTH_REQUIRED');
    }
    const payload = tokenVerifier(match[1]);
    if (typeof payload !== 'object' || typeof payload.sub !== 'string' || !Number.isInteger(payload.ver)) {
      throw new AppError('Authentication token is invalid or expired', 401, 'INVALID_TOKEN');
    }
    const user = await UserModel.findById(payload.sub).select('tokenVersion').lean();
    if (!user || user.tokenVersion !== payload.ver) {
      throw new AppError('Authentication token is invalid or expired', 401, 'INVALID_TOKEN');
    }
    req.user = { _id: user._id, tokenVersion: user.tokenVersion };
    next();
  });
}

export const authMiddleware = createAuthMiddleware();
