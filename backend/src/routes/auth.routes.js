import express from 'express';
import { signup, login, logout, me } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import passport from '../config/passport.js';
import { signToken } from '../utils/jwt.js';
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '../config/authCookie.js';
import { getInviteByCode } from '../controllers/workspace.controller.js';

const router = express.Router();

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
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
  }),
  (req, res) => {
    const user = req.user;
    const token = signToken({ id: user.id, workspaceId: user.workspaceId, role: user.role });

    res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

router.get('/invite/:code', getInviteByCode);

export default router;