import { useState, FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import * as api from '../lib/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) { setError('Missing reset token.'); return; }

    setLoading(true);
    setError('');

    try {
      await api.resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
      api.logError('ResetPassword', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ padding: 'var(--space-12) 0' }}>
        <div className="container" style={{ maxWidth: 420 }}>
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: 'var(--color-success-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)' }}>
              <span style={{ fontSize: 28, color: 'var(--color-success)' }}>✓</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>Password reset successfully</h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-2)', marginBottom: 'var(--space-5)' }}>
              You can now sign in with your new password.
            </p>
            <Link to="/login" className="btn btn-primary">Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div style={{ padding: 'var(--space-12) 0' }}>
        <div className="container" style={{ maxWidth: 420, textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-danger)', marginBottom: 'var(--space-2)' }}>Invalid Link</h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-2)', marginBottom: 'var(--space-4)' }}>Missing reset token.</p>
          <Link to="/forgot-password" className="btn btn-outline">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-12) 0' }}>
      <div className="container" style={{ maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Reset Password</h1>
          <p style={{ fontSize: 15, color: 'var(--color-text-2)' }}>Enter your new password</p>
        </div>

        <div className="card" style={{ padding: 'var(--space-6)' }}>
          {error && (
            <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-danger-muted)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: 13, marginBottom: 'var(--space-4)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <input type="hidden" name="token" value={token} />
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>New Password</label>
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
