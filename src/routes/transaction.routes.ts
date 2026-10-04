import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { ValidationRules, validateRequest } from '../middlewares/validator.middleware';

const router = Router({ mergeParams: true });

router.use(AuthMiddleware.requireAuth);

router.get('/:partyId/ledger', TransactionController.showLedger);
router.post(
  '/:partyId/transactions',
  ValidationRules.transaction(),
  validateRequest(),
  TransactionController.create
);
router.post(
  '/:partyId/transactions/:id/edit',
  ValidationRules.transaction(),
  validateRequest(),
  TransactionController.update
);
router.post('/:partyId/transactions/:id/delete', TransactionController.delete);

export default router;
