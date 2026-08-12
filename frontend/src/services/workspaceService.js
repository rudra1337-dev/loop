import api from './api';

// Centralizing all workspace API calls here (not scattered across components)
// keeps components dumb and makes it trivial to swap the backend later.

export const getWorkspace = () => api.get('/workspace');
export const renameWorkspace = (name) => api.patch('/workspace', { name });

export const getMembers = () => api.get('/workspace/members');
export const updateMemberRole = (userId, role) => api.patch(`/workspace/members/${userId}/role`, { role });
export const removeMember = (userId) => api.delete(`/workspace/members/${userId}`);

export const createInvite = (role) => api.post('/workspace/invites', { role });
export const listInvites = () => api.get('/workspace/invites');
export const revokeInvite = (id) => api.delete(`/workspace/invites/${id}`);

// Public — no auth needed, used by the signup page
export const getInviteByCode = (code) => api.get(`/auth/invite/${code}`);