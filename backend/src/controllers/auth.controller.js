import bcrypt from 'bcryptjs';
import { Workspace, User } from '../models/index.js';
import { signToken } from '../utils/jwt.js';
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
  CLEAR_AUTH_COOKIE_OPTIONS,
} from '../config/authCookie.js';

// SignUp
export const signup = async (req, res) => {
  try {
    const { name, email, password, workspaceName } = req.body;

    if (!name || !email || !password || !workspaceName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create workspace first, creator becomes ADMIN
    const workspace = await Workspace.create({ name: workspaceName });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'ADMIN',
      workspaceId: workspace.id,
    });

    const token = signToken({ id: user.id, workspaceId: user.workspaceId, role: user.role });
    res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, workspaceId: user.workspaceId },
    });
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

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, workspaceId: user.workspaceId },
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', detail: err.message });
  }
};


// Logout
export const logout = (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, CLEAR_AUTH_COOKIE_OPTIONS);
  res.json({ message: 'Logged out' });
};

export const me = (req, res) => {
  const { id, name, email, role, workspaceId } = req.user;
  res.json({ user: { id, name, email, role, workspaceId } });
};
