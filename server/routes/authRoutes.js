import { Router } from 'express';
import { login, logout, me, register } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { validateLogin, validateRegister } from '../utils/validators.js';

const router = Router();

router.post('/register', authLimiter, validate((req) => ({ body: validateRegister(req.body) })), register);
router.post('/login', authLimiter, validate((req) => ({ body: validateLogin(req.body) })), login);
router.get('/me', authMiddleware, me);
router.post('/logout', authMiddleware, logout);

export default router;
