import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { validatePasswordChange, validateSettings } from '../utils/validators.js';
import { presentUser } from '../utils/presenters.js';
import bcrypt from 'bcryptjs';

function presentedSettings(user) {
  return {
    name: user.name,
    email: user.email,
    targetRole: user.settings?.targetRole ?? '',
    preferredLanguage: user.settings?.preferredLanguage ?? 'en',
    theme: user.settings?.theme ?? 'system'
  };
}

export const getSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  return sendSuccess(res, { settings: presentedSettings(user) });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const input = validateSettings(req.validated.body);
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  if (input.email && input.email !== user.email) {
    const existing = await User.exists({ email: input.email, _id: { $ne: user._id } });
    if (existing) {
      throw new AppError('An account with this email already exists', 409, 'EMAIL_IN_USE');
    }
    user.email = input.email;
  }
  if (input.name !== undefined) {
    user.name = input.name;
  }
  for (const key of ['targetRole', 'preferredLanguage', 'theme']) {
    if (input[key] !== undefined) {
      user.settings[key] = input[key];
    }
  }
  try {
    await user.save();
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError('An account with this email already exists', 409, 'EMAIL_IN_USE');
    }
    throw error;
  }
  return sendSuccess(res, { settings: presentedSettings(user), user: presentUser(user) });
});

export const changePassword = asyncHandler(async (req, res) => {
  const input = validatePasswordChange(req.validated.body);
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!user || !(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
    throw new AppError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
  }
  user.passwordHash = await bcrypt.hash(input.newPassword, 12);
  user.tokenVersion += 1;
  await user.save();
  return sendSuccess(res, { passwordChanged: true, reauthenticationRequired: true });
});
