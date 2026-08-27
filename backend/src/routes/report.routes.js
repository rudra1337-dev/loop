import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import * as reportController from '../controllers/report.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', reportController.getReports);
router.get('/:id', reportController.getReport);
router.get('/:id/export', reportController.exportReport);
// Generation is a write action — ADMIN/ANALYST only, same rule as ingestion.
router.post('/generate', authorize('ADMIN', 'ANALYST'), reportController.generateReport);


export default router;