import { Router } from 'express';
import { PartyController } from '../controllers/PartyController';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { ValidationRules, validateRequest } from '../middlewares/validator.middleware';

const router = Router();

router.use(AuthMiddleware.requireAuth);

router.get('/', ValidationRules.listQuery(), validateRequest(), PartyController.index);
router.post('/', ValidationRules.party(), validateRequest(), PartyController.create);

router.get('/:id/edit', PartyController.showEdit);
router.post('/:id/edit', ValidationRules.party(), validateRequest(), PartyController.update);
router.post('/:id/delete', PartyController.delete);

export default router;
