import * as workspaceService from '../services/workspace.service.js';

export const getWorkspace = async (req, res) => {
  res.json({ workspaceId: req.user.workspaceId });
};

export const renameWorkspace = async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ error: 'Workspace name is required' });
  }
  const workspace = await workspaceService.renameWorkspace(req.user.workspaceId, name.trim());
  res.json({ workspace });
};

export const getMembers = async (req, res) => {
  const members = await workspaceService.listMembers(req.user.workspaceId);
  res.json({ members });
};

export const updateMemberRole = async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  const validRoles = ['ADMIN', 'ANALYST', 'VIEWER'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const result = await workspaceService.updateMemberRole({
    workspaceId: req.user.workspaceId,
    userId,
    newRole: role,
    requestingUserId: req.user.id,
  });

  if (result.error) return res.status(400).json({ error: result.error });
  res.json({ user: result.user });
};

export const removeMember = async (req, res) => {
  const { userId } = req.params;
  const result = await workspaceService.removeMember({ workspaceId: req.user.workspaceId, userId });
  if (result.error) return res.status(400).json({ error: result.error });
  res.json({ success: true });
};

export const createInvite = async (req, res) => {
  const { role } = req.body;
  const validRoles = ['ADMIN', 'ANALYST', 'VIEWER'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const invite = await workspaceService.createInvite({
    workspaceId: req.user.workspaceId,
    role,
    createdBy: req.user.id,
  });

  res.status(201).json({ invite });
};

export const listInvites = async (req, res) => {
  const invites = await workspaceService.listInvites(req.user.workspaceId);
  res.json({ invites });
};

export const revokeInvite = async (req, res) => {
  const { id } = req.params;
  const invite = await workspaceService.revokeInvite(id, req.user.workspaceId);
  if (!invite) return res.status(404).json({ error: 'Invite not found' });
  res.json({ success: true });
};

// Public — used by the signup page to preview invite details before submitting
export const getInviteByCode = async (req, res) => {
  const { code } = req.params;
  const invite = await workspaceService.getInviteByCode(code);
  if (!invite) return res.status(404).json({ error: 'Invalid or expired invite link' });
  res.json({ invite });
};