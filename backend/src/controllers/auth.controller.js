import bcrypt from 'bcryptjs';
import { Workspace, User } from '../models/index.js';
import { signToken } from '../utils/jwt.js';
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
  CLEAR_AUTH_COOKIE_OPTIONS,
} from '../config/authCookie.js';
import { getInviteByCode } from '../services/workspace.service.js';

// SignUp
export const signup = async (req, res) => {
  try {
    const { name, email, password, workspaceName, inviteCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    let workspaceId;
    let role = 'ADMIN';

    if (inviteCode) {
      const invite = await getInviteByCode(inviteCode);
      if (!invite) {
        return res.status(400).json({ error: 'Invalid or expired invite link' });
      }

      workspaceId = invite.workspaceId;
      role = invite.role;
    } else {
      if (!workspaceName) {
        return res.status(400).json({ error: 'Workspace name is required to create a new workspace' });
      }

      const workspace = await Workspace.create({ name: workspaceName });
      workspaceId = workspace.id;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role, workspaceId });

    const token = signToken({ id: user.id, workspaceId: user.workspaceId, role: user.role });
    res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

    res.status(201).json({ user: await buildUserResponse(user) });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed', detail: err.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id, workspaceId: user.workspaceId, role: user.role });
    res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

    res.json({ user: await buildUserResponse(user) });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', detail: err.message });
  }
};

// Logout
export const logout = (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, CLEAR_AUTH_COOKIE_OPTIONS);
  res.json({ message: 'Logged out' });
};

export const me = async (req, res) => {
  res.json({ user: await buildUserResponse(req.user) });
};

const buildUserResponse = async (user) => {
  const workspace = await Workspace.findByPk(user.workspaceId);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    workspaceId: user.workspaceId,
    workspaceName: workspace?.name || null,
  };
};