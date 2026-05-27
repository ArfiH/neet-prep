import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
      api.logError('ForgotPassword', err);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div style={{ padding: 'var(--space-12) 0' }}>
        <div className="container" style={{ maxWidth: 420 }}>
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: 'var(--color-success-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)' }}>
              <span style={{ fontSize: 28, color: 'var(--color-success)' }}>✓</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>Check your email</h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-2)', marginBottom: 'var(--space-5)' }}>
              If an account exists with <strong>{email}</strong>, you'll receive a password reset link shortly.
            </p>
            <Link to="/login" className="btn btn-outline">Back to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-12) 0' }}>
      <div className="container" style={{ maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Forgot Password</h1>
          <p style={{ fontSize: 15, color: 'var(--color-text-2)' }}>Enter your email to receive a reset link</p>
        </div>

        <div className="card" style={{ padding: 'var(--space-6)' }}>
          {error && (
            <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-danger-muted)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: 13, marginBottom: 'var(--space-4)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>Email</label>
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
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: 14, color: 'var(--color-text-2)' }}>
          <Link to="/login" style={{ fontWeight: 600 }}>Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
