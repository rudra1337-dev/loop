import "./WorkspaceSettings.css";
import { useState, useEffect } from 'react';
import { useAuth, useWorkspace } from '../../store/hooks';
import PageHeader from '../../components/common/PageHeader/PageHeader';
import ErrorState from '../../components/common/ErrorState/ErrorState';

const WorkspaceSettings = () => {
  const { user, refetch } = useAuth();
  const {
    workspace,
    members,
    invites,
    loading,
    error: workspaceError,
    renameSuccess,
    loadWorkspace,
    rename,
    updateRole,
    removeMember,
    createInvite,
    revokeInvite,
    clearError,
    clearRenameSuccess
  } = useWorkspace();

  const [newInviteRole, setNewInviteRole] = useState('ANALYST');
  const [workspaceName, setWorkspaceName] = useState('');
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    loadWorkspace();
    return () => {
      clearError();
      clearRenameSuccess();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (workspace) {
      setWorkspaceName(workspace.name || user?.workspaceName || '');
    }
  }, [workspace, user]);

  const handleRename = async (e) => {
    e.preventDefault();
    clearRenameSuccess();
    clearError();
    setRenaming(true);
    try {
      await rename(workspaceName.trim());
      await refetch(); // pulls the new name into Redux so Dashboard updates too
    } catch {
      // Error is caught and stored in Redux workspace state
    } finally {
      setRenaming(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    clearError();
    try {
      await updateRole(userId, newRole);
    } catch {
      // Error is caught and stored in Redux workspace state
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this member from the workspace?')) return;
    clearError();
    try {
      await removeMember(userId);
    } catch {
      // Error is caught and stored in Redux workspace state
    }
  };

  const handleCreateInvite = async () => {
    clearError();
    try {
      await createInvite(newInviteRole);
    } catch {
      // Error is caught and stored in Redux workspace state
    }
  };

  const handleRevoke = async (id) => {
    clearError();
    try {
      await revokeInvite(id);
    } catch {
      // Error is caught and stored in Redux workspace state
    }
  };

  const copyInviteLink = (code) => {
    const link = `${window.location.origin}/signup?code=${code}`;
    navigator.clipboard.writeText(link);
    alert('Invite link copied!');
  };

  if (loading && !workspace) return <p>Loading workspace settings...</p>;

  return (
    <div style={{ maxWidth: '800px' }}>
      <PageHeader
        title="Workspace Settings"
        subtitle={`Manage member permissions and invite collaborators to ${user?.workspaceName}`}
      />

      {workspaceError && <ErrorState message={workspaceError} />}

      <div className="glass-card">
        <h2>Rename Workspace</h2>
        <form onSubmit={handleRename} className="rename-form">
          <input
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            required
            placeholder="Workspace Name"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={renaming}>
            {renaming ? 'Saving...' : 'Rename'}
          </button>
        </form>
        {renameSuccess && <p style={{ color: 'var(--color-pos)', marginTop: '8px', fontSize: '13px' }}>✓ Workspace renamed successfully!</p>}
      </div>

      <div className="glass-card">
        <h2>Workspace Members</h2>
        <div className="table-container" style={{ margin: 0 }}>
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
                      <button onClick={() => handleRemove(member.id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}>
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

      <div className="glass-card">
        <h2>Invite Collaborators</h2>
        <p className="subtitle">Generate secure invite links with predefined roles for new team members.</p>
        <div className="invite-form">
          <select 
            value={newInviteRole} 
            onChange={(e) => setNewInviteRole(e.target.value)}
          >
            <option value="ADMIN">Admin</option>
            <option value="ANALYST">Analyst</option>
            <option value="VIEWER">Viewer</option>
          </select>
          <button onClick={handleCreateInvite} className="btn btn-primary">
            Generate Link
          </button>
        </div>

        {invites.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No active invite links generated yet.</p>
        ) : (
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>Active Invites</h3>
            <ul className="invite-list">
              {invites.map((invite) => (
                <li key={invite.id} className="invite-item">
                  <div className="invite-info">
                    <span className="badge badge-neu" style={{ color: 'var(--text-primary)', border: 'none', background: 'rgba(255,255,255,0.1)', marginRight: '0' }}>
                      {invite.role}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>Code: {invite.code}</span>
                  </div>
                  <div className="invite-actions">
                    <button onClick={() => copyInviteLink(invite.code)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      Copy
                    </button>
                    <button onClick={() => handleRevoke(invite.id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}>
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
