import { Router } from 'express';
import { ReportController } from '../controllers/ReportController';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

router.use(AuthMiddleware.requireAuth);

router.get('/:partyId/report/pdf', ReportController.downloadPdf);
router.get('/:partyId/report/xlsx', ReportController.downloadExcel);

export default router;
