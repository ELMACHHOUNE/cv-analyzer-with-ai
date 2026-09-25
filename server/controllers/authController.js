import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { presentUser } from '../utils/presenters.js';
import { signAccessToken } from '../utils/jwt.js';

const invalidCredentials = new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

function tokenData(user, tokenSigner) {
  return {
    user: presentUser(user),
    token: tokenSigner(user),
    expiresIn: process.env.JWT_EXPIRES_IN?.trim() || '7d'
  };
}

export function createAuthController({
  UserModel = User,
  hashPassword = (password) => bcrypt.hash(password, 12),
  comparePassword = (password, hash) => bcrypt.compare(password, hash),
  tokenSigner = signAccessToken
} = {}) {
  return {
    register: asyncHandler(async (req, res) => {
      const input = req.validated.body;
      const existing = await UserModel.exists({ email: input.email });
      if (existing) {
        throw new AppError('An account with this email already exists', 409, 'EMAIL_IN_USE');
      }
      let user;
      try {
        user = await UserModel.create({
          name: input.name,
          email: input.email,
          passwordHash: await hashPassword(input.password)
        });
      } catch (error) {
        if (error?.code === 11000) {
          throw new AppError('An account with this email already exists', 409, 'EMAIL_IN_USE');
        }
        throw error;
      }
      return sendSuccess(res, tokenData(user, tokenSigner), 201);
    }),

    login: asyncHandler(async (req, res) => {
      const input = req.validated.body;
      const user = await UserModel.findOne({ email: input.email }).select('+passwordHash');
      const passwordHash = user?.passwordHash;
      const validPassword = passwordHash ? await comparePassword(input.password, passwordHash) : false;
      if (!user || !validPassword) {
        throw invalidCredentials;
      }
      return sendSuccess(res, tokenData(user, tokenSigner));
    }),

    me: asyncHandler(async (req, res) => {
      const user = await UserModel.findById(req.user._id);
      if (!user) {
        throw new AppError('Authentication token is invalid or expired', 401, 'INVALID_TOKEN');
      }
      return sendSuccess(res, { user: presentUser(user) });
    }),

    logout: asyncHandler(async (req, res) => {
      await UserModel.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
      return sendSuccess(res, { loggedOut: true });
    })
  };
}

const controller = createAuthController();
export const register = controller.register;
export const login = controller.login;
export const me = controller.me;
export const logout = controller.logout;
