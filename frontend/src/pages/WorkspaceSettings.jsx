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
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1>Workspace Settings</h1>
        <p class="subtitle">Manage member permissions and invite collaborators to {user?.workspaceName}</p>
      </div>

      {error && <div class="alert alert-error"><span>⚠️</span> {error}</div>}

      <div class="glass-card">
        <h2>Rename Workspace</h2>
        <form onSubmit={handleRename} style={{ display: 'flex', gap: '12px' }}>
          <input
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            required
            placeholder="Workspace Name"
            style={{ flex: 1 }}
          />
          <button type="submit" class="btn btn-primary" disabled={renaming}>
            {renaming ? 'Saving...' : 'Rename'}
          </button>
        </form>
        {renameSuccess && <p style={{ color: 'var(--color-pos)', marginTop: '8px', fontSize: '13px' }}>✓ Workspace renamed successfully!</p>}
      </div>

      <div class="glass-card">
        <h2>Workspace Members</h2>
        <div class="table-container" style={{ margin: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th style={{ width: '100px' }}></th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td><strong>{member.name}</strong></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{member.email}</td>
                  <td>
                    <select
                      value={member.role}
                      disabled={member.id === user.id}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="ANALYST">Analyst</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                  </td>
                  <td>
                    {member.id !== user.id && (
                      <button onClick={() => handleRemove(member.id)} class="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div class="glass-card">
        <h2>Invite Collaborators</h2>
        <p class="subtitle">Generate secure invite links with predefined roles for new team members.</p>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <select 
            value={newInviteRole} 
            onChange={(e) => setNewInviteRole(e.target.value)}
            style={{ width: '160px' }}
          >
            <option value="ADMIN">Admin</option>
            <option value="ANALYST">Analyst</option>
            <option value="VIEWER">Viewer</option>
          </select>
          <button onClick={handleCreateInvite} class="btn btn-primary">
            Generate Link
          </button>
        </div>

        {invites.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No active invite links generated yet.</p>
        ) : (
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>Active Invites</h3>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {invites.map((invite) => (
                <li key={invite.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                  <div>
                    <span class="badge badge-neu" style={{ color: 'var(--text-primary)', border: 'none', background: 'rgba(255,255,255,0.1)', marginRight: '12px' }}>
                      {invite.role}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>Code: {invite.code}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => copyInviteLink(invite.code)} class="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      Copy
                    </button>
                    <button onClick={() => handleRevoke(invite.id)} class="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      Revoke
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceSettings;
