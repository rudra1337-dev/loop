import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware.js';
import * as feedbackController from '../controllers/feedback.controller.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure upload directory exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed!'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// All feedback routes require authentication
router.use(authenticate);

// CRUD and stats
router.get('/', feedbackController.getFeedbacks);
router.get('/stats', feedbackController.getStats);
router.delete('/:id', feedbackController.deleteFeedback);

// Ingestion endpoints
router.post('/ingest/single', feedbackController.ingestSingle);
router.post('/ingest/csv', upload.single('file'), feedbackController.ingestCSV);

export default router;
