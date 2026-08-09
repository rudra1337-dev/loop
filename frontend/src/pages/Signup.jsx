import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', workspaceName: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signup(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ width: '320px' }}>
        <h1>Create your LOOP workspace</h1>

        <form onSubmit={handleSubmit}>
          <div>
            <label>Your Name</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>

          <div>
            <label>Workspace Name</label>
            <input name="workspaceName" value={form.workspaceName} onChange={handleChange} required placeholder="e.g. Acme Corp" />
          </div>

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
            {submitting ? 'Creating...' : 'Create Workspace'}
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