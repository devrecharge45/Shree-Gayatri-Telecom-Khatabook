import { Router } from 'express';
import { PortalController } from '../controllers/PortalController';
import { PortalAuthMiddleware } from '../middlewares/portal-auth.middleware';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rate-limiter';

const router = Router();

// Guest portal routes (Customer Login)
router.get('/login', PortalAuthMiddleware.guestOnly, PortalController.showLogin);
router.post('/login', authRateLimiter, PortalAuthMiddleware.guestOnly, PortalController.login);

// Portal Logout
router.post('/logout', PortalController.logout);
router.get('/logout', PortalController.logout);

// Authenticated Party Routes (Strictly Read-Only Passbook)
router.get('/passbook', PortalAuthMiddleware.requirePartyAuth, PortalController.passbook);
router.get('/report/pdf', PortalAuthMiddleware.requirePartyAuth, PortalController.downloadPdf);
router.get('/report/xlsx', PortalAuthMiddleware.requirePartyAuth, PortalController.downloadXlsx);

// Admin-Only Preview (Allows store admin to preview customer's passbook)
router.get('/preview/:partyId', AuthMiddleware.requireAuth, PortalController.preview);

export default router;
