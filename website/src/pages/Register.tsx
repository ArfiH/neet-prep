import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useMediaQuery } from '../lib/useMediaQuery';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await register(email, password, name || undefined);
      setRegistered(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div style={{ padding: isMobile ? 'var(--space-8) 0' : 'var(--space-12) 0' }}>
        <div className="container" style={{ maxWidth: 420 }}>
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: 'var(--color-success-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)' }}>
              <span style={{ fontSize: 28, color: 'var(--color-success)' }}>✓</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>Check your email</h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-2)', marginBottom: 'var(--space-5)' }}>
              We sent a verification link to <strong>{email}</strong>. Click the link to activate your account.
            </p>
            <Link to="/login" className="btn btn-primary">Go to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? 'var(--space-8) 0' : 'var(--space-12) 0' }}>
      <div className="container" style={{ maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Create your account</h1>
          <p style={{ fontSize: 15, color: 'var(--color-text-2)' }}>Start your NEET preparation journey</p>
        </div>

        <div className="card" style={{ padding: 'var(--space-6)' }}>
          {error && (
            <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-danger-muted)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: 13, marginBottom: 'var(--space-4)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>Name (optional)</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                  fontSize: 14, outline: 'none',
                  color: 'var(--color-text)', background: 'var(--color-paper-2)',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>Email <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                  fontSize: 14, outline: 'none',
                  color: 'var(--color-text)', background: 'var(--color-paper-2)',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>Password <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                  fontSize: 14, outline: 'none',
                  color: 'var(--color-text)', background: 'var(--color-paper-2)',
                }}
              />
              <p style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 4 }}>At least 6 characters</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: 14, color: 'var(--color-text-2)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
