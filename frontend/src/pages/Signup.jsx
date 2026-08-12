import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInviteByCode } from '../services/workspaceService';

const Signup = () => {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('code'); // null if not present

  const [form, setForm] = useState({ name: '', email: '', password: '', workspaceName: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Invite-preview state — fetched once on mount if a code is in the URL
  const [inviteInfo, setInviteInfo] = useState(null);
  const [inviteError, setInviteError] = useState('');
  const [checkingInvite, setCheckingInvite] = useState(!!inviteCode);

  useEffect(() => {
    if (!inviteCode) return;

    getInviteByCode(inviteCode)
      .then((res) => setInviteInfo(res.data.invite))
      .catch(() => setInviteError('This invite link is invalid or has expired.'))
      .finally(() => setCheckingInvite(false));
  }, [inviteCode]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      // Only send inviteCode if present — backend decides the workspace/role,
      // frontend just passes the token through untouched.
      await signup({ ...form, inviteCode: inviteCode || undefined });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Block the form entirely while we're still checking an invite —
  // prevents a flash of the "create workspace" field before we know better.
  if (checkingInvite) {
    return <div style={{ textAlign: 'center', marginTop: '100px' }}>Checking invite link...</div>;
  }

  if (inviteCode && inviteError) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2>{inviteError}</h2>
        <Link to="/signup">Sign up without an invite instead</Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ width: '320px' }}>
        <h1>{inviteInfo ? `Join ${inviteInfo.workspaceName}` : 'Create your LOOP workspace'}</h1>

        {inviteInfo && (
          <p style={{ background: '#eef', padding: '8px', borderRadius: '4px' }}>
            You're joining as <strong>{inviteInfo.role}</strong>
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div>
            <label>Your Name</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>

          {/* Only show workspace-name field when NOT joining via invite —
              an invited user joins an existing workspace, they don't name one. */}
          {!inviteInfo && (
            <div>
              <label>Workspace Name</label>
              <input
                name="workspaceName"
                value={form.workspaceName}
                onChange={handleChange}
                required
                placeholder="e.g. Acme Corp"
              />
            </div>
          )}

          <div>
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>

          <div>
            <label>Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={8} />
          </div>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : inviteInfo ? 'Join Workspace' : 'Create Workspace'}
          </button>
        </form>

        <div style={{ margin: '16px 0', textAlign: 'center' }}>— or —</div>

        <button onClick={loginWithGoogle} style={{ width: '100%' }}>
          Continue with Google
        </button>

        <p style={{ marginTop: '16px', textAlign: 'center' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;