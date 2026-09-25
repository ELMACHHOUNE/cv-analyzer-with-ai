import { describe, expect, it, vi } from 'vitest';
import { createAuthController } from '../controllers/authController.js';
import { validateLogin, validateRegister } from '../utils/validators.js';

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

describe('authentication validation and behavior', () => {
  it('normalizes valid registration data', () => {
    expect(validateRegister({
      name: '  Ada Lovelace ',
      email: ' ADA@EXAMPLE.COM ',
      password: 'secure123'
    })).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secure123'
    });
  });

  it('rejects invalid registration without echoing the password', () => {
    try {
      validateRegister({ name: 'A', email: 'invalid', password: 'short' });
      throw new Error('Expected validation to fail');
    } catch (error) {
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(JSON.stringify(error.details)).not.toContain('short');
    }
  });

  it('returns a conflict during duplicate registration without hashing', async () => {
    const UserModel = {
      exists: vi.fn().mockResolvedValue({ _id: 'existing' }),
      create: vi.fn()
    };
    const hashPassword = vi.fn();
    const controller = createAuthController({
      UserModel,
      hashPassword,
      tokenSigner: vi.fn()
    });
    const req = {
      validated: {
        body: { name: 'Ada Lovelace', email: 'ada@example.com', password: 'secure123' }
      }
    };
    await expect(controller.register(req, responseRecorder())).rejects.toMatchObject({
      statusCode: 409,
      code: 'EMAIL_IN_USE'
    });
    expect(hashPassword).not.toHaveBeenCalled();
    expect(UserModel.create).not.toHaveBeenCalled();
  });

  it('uses the same invalid-credentials response for an unknown account', async () => {
    const findOne = vi.fn(() => ({ select: vi.fn().mockResolvedValue(null) }));
    const controller = createAuthController({
      UserModel: { findOne },
      comparePassword: vi.fn(),
      tokenSigner: vi.fn()
    });
    const req = { validated: { body: validateLogin({ email: 'missing@example.com', password: 'secure123' }) } };
    await expect(controller.login(req, responseRecorder())).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password'
    });
  });
});
