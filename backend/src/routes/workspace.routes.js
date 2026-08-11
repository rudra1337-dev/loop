import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import * as workspaceController from '../controllers/workspace.controller.js';

const router = express.Router();

// All routes below require login
router.use(authenticate);

router.get('/', workspaceController.getWorkspace);
router.patch('/', authorize('ADMIN'), workspaceController.renameWorkspace);

router.get('/members', workspaceController.getMembers); // everyone can view
router.patch('/members/:userId/role', authorize('ADMIN'), workspaceController.updateMemberRole);
router.delete('/members/:userId', authorize('ADMIN'), workspaceController.removeMember);

router.post('/invites', authorize('ADMIN'), workspaceController.createInvite);
router.get('/invites', authorize('ADMIN'), workspaceController.listInvites);
router.delete('/invites/:id', authorize('ADMIN'), workspaceController.revokeInvite);

export default router;