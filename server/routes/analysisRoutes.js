import { Router } from 'express';
import { compare, create, createForResume, get, improve, latest, list, recommendations, remove } from '../controllers/analysisController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimitMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  validateAnalysisCreate,
  validateComparison,
  validateIdParam,
  validateImprovement,
  validateLatestQuery,
  validateListQuery
} from '../utils/validators.js';

const router = Router();
router.use(authMiddleware);

router.post('/', aiLimiter, validate((req) => ({ body: validateAnalysisCreate(req.body) })), create);
router.get('/', validate((req) => ({ query: validateListQuery(req.query, ['resumeId', 'search']) })), list);
router.get('/latest', validate((req) => ({ query: validateLatestQuery(req.query) })), latest);
router.post('/compare', validate((req) => ({ body: validateComparison(req.body) })), compare);
router.post('/:resumeId', aiLimiter, validate((req) => ({
  params: { resumeId: validateIdParam(req.params.resumeId) },
  body: validateAnalysisCreate(req.body, true)
})), createForResume);
router.get('/:idOrResumeId', validate((req) => ({
  params: { idOrResumeId: validateIdParam(req.params.idOrResumeId) }
})), get);
router.delete('/:id', validate((req) => ({ params: { id: validateIdParam(req.params.id) } })), remove);
router.post('/:id/improve', aiLimiter, validate((req) => ({
  params: { id: validateIdParam(req.params.id) },
  body: validateImprovement(req.body)
})), improve);
router.post('/:id/recommendations', aiLimiter, validate((req) => ({
  params: { id: validateIdParam(req.params.id) }
})), recommendations);

export default router;
