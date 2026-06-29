import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useMediaQuery } from '../lib/useMediaQuery';
import * as api from '../lib/api';

export default function VerifyEmail() {
  const { verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const location = useLocation();

  const email = (location.state as any)?.email || '';

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verified, setVerified] = useState(false);

  // Auto-verify from URL params (deep link from email)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      setToken(urlToken);
      handleVerify(urlToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleVerify(t: string) {
    setLoading(true);
    setError('');
    try {
      await verifyEmail(t);
      setVerified(true);
    } catch (err: any) {
      setError(err.message || 'Verification failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setError('');
    setSuccess('');
    try {
      await resendVerification(email);
      setSuccess('Verification email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification.');
    } finally {
      setResending(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    handleVerify(token.trim());
  };

  if (verified) {
    return (
      <div style={{ padding: isMobile ? 'var(--space-8) 0' : 'var(--space-12) 0' }}>
        <div className="container" style={{ maxWidth: 420 }}>
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: 'var(--color-success-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)' }}>
              <span style={{ fontSize: 28, color: 'var(--color-success)' }}>✓</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>Email Verified!</h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-2)', marginBottom: 'var(--space-5)' }}>
              Your account is now active. You can sign in and start using all features.
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Verify your email</h1>
          <p style={{ fontSize: 15, color: 'var(--color-text-2)' }}>
            {email ? `Enter the verification code sent to ${email}` : 'Enter the token from your verification email'}
          </p>
        </div>

        <div className="card" style={{ padding: 'var(--space-6)' }}>
          {error && (
            <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-danger-muted)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: 13, marginBottom: 'var(--space-4)' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-success-muted)', color: 'var(--color-success)', borderRadius: 'var(--radius-md)', fontSize: 13, marginBottom: 'var(--space-4)' }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>Verification Token</label>
              <input
                type="text"
                required
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="Paste your verification token"
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                  fontSize: 14, outline: 'none', fontFamily: 'monospace',
                  color: 'var(--color-text)', background: 'var(--color-paper-2)',
                }}
              />
              <p style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 4 }}>
                Or click the link in your email — it will auto-fill this.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', opacity: loading || !token.trim() ? 0.6 : 1 }}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          {email && (
            <div style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
              <button
                onClick={handleResend}
                disabled={resending}
                style={{
                  background: 'none', border: 'none', cursor: resending ? 'not-allowed' : 'pointer',
                  fontSize: 14, color: 'var(--color-accent)', fontWeight: 600,
                  opacity: resending ? 0.6 : 1,
                }}
              >
                {resending ? 'Sending...' : 'Resend verification email'}
              </button>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: 14, color: 'var(--color-text-2)' }}>
          <Link to="/login" style={{ fontWeight: 600 }}>Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
