import { Router } from 'express';
import { ProfileController } from '../controllers/ProfileController';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { ValidationRules, validateRequest } from '../middlewares/validator.middleware';

const router = Router();

router.use(AuthMiddleware.requireAuth);

router.get('/', ProfileController.showProfile);
router.post(
  '/reset-password',
  ValidationRules.resetPassword(),
  validateRequest('pages/profile/index'),
  ProfileController.resetPassword
);

export default router;
