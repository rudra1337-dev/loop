import express from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import * as feedbackController from '../controllers/feedback.controller.js';
import * as ingestionController from '../controllers/ingestion.controller.js';
import * as statsController from '../controllers/stats.controller.js';
import * as themeController from '../controllers/theme.controller.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

// Resolve uploads directory relative to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + '-' + Math.round(Math.random() * 1e9);

    cb(
      null,
      file.fieldname +
        '-' +
        uniqueSuffix +
        path.extname(file.originalname)
    );
  },
});

// Accept CSV files only
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'text/csv' ||
    file.originalname.toLowerCase().endsWith('.csv')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
});

// All feedback routes require authentication
router.use(authenticate);

// Read access
router.get('/', feedbackController.getFeedbacks);
router.get('/stats', statsController.getStats);
router.get('/trends', statsController.getTrends);
router.get('/themes', themeController.getThemes);

// Write access — ADMIN/ANALYST only
router.post('/ingest/single', authorize('ADMIN', 'ANALYST'), ingestionController.ingestSingle);
router.post('/ingest/csv', authorize('ADMIN', 'ANALYST'), upload.single('file'), ingestionController.ingestCSV);
router.post('/ingest/channel', authorize('ADMIN', 'ANALYST'), ingestionController.ingestChannel);
router.patch('/:id/status', authorize('ADMIN', 'ANALYST'), feedbackController.updateStatus);
router.delete('/:id', authorize('ADMIN', 'ANALYST'), feedbackController.deleteFeedback);

export default router;