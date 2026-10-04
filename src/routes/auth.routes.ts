import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rate-limiter';
import { ValidationRules, validateRequest } from '../middlewares/validator.middleware';

const router = Router();

// Guest-only routes
router.get('/login', AuthMiddleware.guestOnly, AuthController.showLogin);
router.post(
  '/login',
  authRateLimiter,
  AuthMiddleware.guestOnly,
  ValidationRules.login(),
  validateRequest('pages/auth/login'),
  AuthController.login
);

router.get('/register', AuthMiddleware.guestOnly, AuthController.showRegister);
router.post(
  '/register',
  authRateLimiter,
  AuthMiddleware.guestOnly,
  ValidationRules.register(),
  validateRequest('pages/auth/register'),
  AuthController.register
);

router.post('/logout', AuthController.logout);
router.get('/logout', AuthController.logout);

export default router;
