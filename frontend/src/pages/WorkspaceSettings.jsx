import { useState, useEffect } from 'react';
import * as workspaceService from '../services/workspaceService';
import { useAuth } from '../context/AuthContext';

const WorkspaceSettings = () => {
    const { user, refetch } = useAuth(); // refetch lets us refresh the name in AuthContext after rename
    const [members, setMembers] = useState([]);
    const [invites, setInvites] = useState([]);
    const [newInviteRole, setNewInviteRole] = useState('ANALYST');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    // Rename state
    const [workspaceName, setWorkspaceName] = useState('');
    const [renaming, setRenaming] = useState(false);
    const [renameSuccess, setRenameSuccess] = useState(false);

  // Load members + invites together on mount
    const loadData = async () => {
        try {
        const [workspaceRes, membersRes, invitesRes] = await Promise.all([
            workspaceService.getWorkspace(),
            workspaceService.getMembers(),
            workspaceService.listInvites(),
        ]);
        setWorkspaceName(workspaceRes.data.workspace?.name || user?.workspaceName || '');
        setMembers(membersRes.data.members);
        setInvites(invitesRes.data.invites);
        } catch (err) {
        setError('Failed to load workspace data.');
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRename = async (e) => {
        e.preventDefault();
        setError('');
        setRenameSuccess(false);
        setRenaming(true);
        try {
        await workspaceService.renameWorkspace(workspaceName.trim());
        await refetch(); // pulls the new name into AuthContext so Dashboard updates too
        setRenameSuccess(true);
        } catch (err) {
        setError(err.response?.data?.error || 'Failed to rename workspace');
        } finally {
        setRenaming(false);
        }
    };

 
  const handleRoleChange = async (userId, newRole) => {
    setError('');
    try {
      await workspaceService.updateMemberRole(userId, newRole);
      await loadData(); // re-fetch to reflect the change — simple, avoids state-sync bugs
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this member from the workspace?')) return;
    setError('');
    try {
      await workspaceService.removeMember(userId);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleCreateInvite = async () => {
    setError('');
    try {
      await workspaceService.createInvite(newInviteRole);
      await loadData();
    } catch (err) {
      setError('Failed to generate invite');
    }
  };

  const handleRevoke = async (id) => {
    try {
      await workspaceService.revokeInvite(id);
      await loadData();
    } catch (err) {
      setError('Failed to revoke invite');
    }
  };

  const copyInviteLink = (code) => {
    const link = `${window.location.origin}/signup?code=${code}`;
    navigator.clipboard.writeText(link);
    alert('Invite link copied!');
  };

  if (loading) return <p>Loading workspace settings...</p>;

  return (
    <div style={{ padding: '40px', maxWidth: '700px' }}>
      <h1>Workspace Settings</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

        <form onSubmit={handleRename} style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
            <input
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            required
            style={{ flex: 1 }}
            />
            <button type="submit" disabled={renaming}>
            {renaming ? 'Saving...' : 'Save'}
            </button>
        </form>
        {renameSuccess && <p style={{ color: 'green' }}>Workspace renamed!</p>}

      <h2>Members</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Name</th>
            <th style={{ textAlign: 'left' }}>Email</th>
            <th style={{ textAlign: 'left' }}>Role</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td>{member.name}</td>
              <td>{member.email}</td>
              <td>
                {/* Prevent editing your own role from this dropdown to avoid
                    accidental self-lockout — backend also guards this. */}
                <select
                  value={member.role}
                  disabled={member.id === user.id}
                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="ANALYST">Analyst</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </td>
              <td>
                {member.id !== user.id && (
                  <button onClick={() => handleRemove(member.id)}>Remove</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: '32px' }}>Invite Links</h2>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <select value={newInviteRole} onChange={(e) => setNewInviteRole(e.target.value)}>
          <option value="ADMIN">Admin</option>
          <option value="ANALYST">Analyst</option>
          <option value="VIEWER">Viewer</option>
        </select>
        <button onClick={handleCreateInvite}>Generate Invite Link</button>
      </div>

      {invites.length === 0 && <p>No active invite links.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {invites.map((invite) => (
          <li key={invite.id} style={{ marginBottom: '8px' }}>
            <strong>{invite.role}</strong>
            <button onClick={() => copyInviteLink(invite.code)} style={{ marginLeft: '8px' }}>
              Copy Link
            </button>
            <button onClick={() => handleRevoke(invite.id)} style={{ marginLeft: '8px' }}>
              Revoke
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WorkspaceSettings;
