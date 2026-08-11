import { nanoid } from 'nanoid';
import { Workspace, User, WorkspaceInvite } from '../models/index.js';

/**
 * Generates a new invite code for a workspace.
 * The code is a random 10-char string — unguessable, not sequential,
 * so nobody can enumerate other workspaces' invites.
 */
export const createInvite = async ({ workspaceId, role, createdBy }) => {
  const code = nanoid(10);
  return WorkspaceInvite.create({ code, role, workspaceId, createdBy });
};

/**
 * Looks up an invite by its public code. Returns workspace name + role
 * so the signup page can display "Join X as Y" — but never exposes
 * internal IDs or lets the client dictate the role.
 */
export const getInviteByCode = async (code) => {
  const invite = await WorkspaceInvite.findOne({
    where: { code, active: true },
    include: [{ model: Workspace, attributes: ['id', 'name'] }],
  });

  if (!invite) return null;

  return {
    workspaceId: invite.workspaceId,
    workspaceName: invite.Workspace.name,
    role: invite.role,
  };
};

export const revokeInvite = async (inviteId, workspaceId) => {
  // Scoped by workspaceId too — prevents an admin from revoking
  // another workspace's invite by guessing an ID.
  const invite = await WorkspaceInvite.findOne({ where: { id: inviteId, workspaceId } });
  if (!invite) return null;
  invite.active = false;
  await invite.save();
  return invite;
};

export const listInvites = async (workspaceId) => {
  return WorkspaceInvite.findAll({ where: { workspaceId, active: true } });
};

export const listMembers = async (workspaceId) => {
  return User.findAll({
    where: { workspaceId },
    attributes: ['id', 'name', 'email', 'role'], // never return passwordHash
  });
};

export const updateMemberRole = async ({ workspaceId, userId, newRole, requestingUserId }) => {
  const user = await User.findOne({ where: { id: userId, workspaceId } });
  if (!user) return { error: 'User not found in this workspace' };

  // Guard: prevent the last remaining Admin from demoting themselves,
  // which would leave the workspace with nobody able to manage it.
  if (user.role === 'ADMIN' && newRole !== 'ADMIN') {
    const adminCount = await User.count({ where: { workspaceId, role: 'ADMIN' } });
    if (adminCount <= 1) {
      return { error: 'Cannot demote the last remaining Admin' };
    }
  }

  user.role = newRole;
  await user.save();
  return { user };
};

export const removeMember = async ({ workspaceId, userId }) => {
  const user = await User.findOne({ where: { id: userId, workspaceId } });
  if (!user) return { error: 'User not found in this workspace' };

  if (user.role === 'ADMIN') {
    const adminCount = await User.count({ where: { workspaceId, role: 'ADMIN' } });
    if (adminCount <= 1) {
      return { error: 'Cannot remove the last remaining Admin' };
    }
  }

  await user.destroy();
  return { success: true };
};

export const renameWorkspace = async (workspaceId, name) => {
  const workspace = await Workspace.findByPk(workspaceId);
  if (!workspace) return null;
  workspace.name = name;
  await workspace.save();
  return workspace;
};