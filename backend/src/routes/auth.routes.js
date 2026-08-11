import express from 'express';
import { signup, login, logout, me } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import passport from '../config/passport.js';
import { signToken } from '../utils/jwt.js';
import { getInviteByCode } from '../controllers/workspace.controller.js';

const router = express.Router();
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
  (req, res) => {
    const user = req.user;
    const token = signToken({ id: user.id, workspaceId: user.workspaceId, role: user.role });
    res.cookie('token', token, COOKIE_OPTIONS);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);
router.get('/invite/:code', getInviteByCode);

export default router;







