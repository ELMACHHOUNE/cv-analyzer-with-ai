import { Router } from 'express';
import { analyze, create, get, list, remove, update } from '../controllers/jobController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimitMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { validateForceQuery, validateIdParam, validateJob, validateListQuery } from '../utils/validators.js';

const router = Router();
router.use(authMiddleware);

router.post('/', validate((req) => ({ body: validateJob(req.body) })), create);
router.get('/', validate((req) => ({ query: validateListQuery(req.query, ['search']) })), list);
router.post('/:id/analyze', aiLimiter, validate((req) => ({
  params: { id: validateIdParam(req.params.id) },
  query: validateForceQuery(req.query)
})), analyze);
router.get('/:id', validate((req) => ({ params: { id: validateIdParam(req.params.id) } })), get);
router.patch('/:id', validate((req) => ({
  params: { id: validateIdParam(req.params.id) },
  body: validateJob(req.body, true)
})), update);
router.delete('/:id', validate((req) => ({ params: { id: validateIdParam(req.params.id) } })), remove);

export default router;
