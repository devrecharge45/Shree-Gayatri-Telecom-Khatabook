import { Router } from 'express';
import { ManifestController } from '../controllers/ManifestController';

const router = Router();

router.get('/manifest.json', ManifestController.getManifest);

export default router;
