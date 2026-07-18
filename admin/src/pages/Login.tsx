import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin, loginWithToken, getUrlToken, adminForgotPassword } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const tokenParam = getUrlToken();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tokenInput, setTokenInput] = useState(tokenParam || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'token'>(tokenParam ? 'token' : 'login');
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminLogin(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToken = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithToken(tokenInput);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminForgotPassword(forgotEmail);
      setForgotSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (forgotMode) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <div style={iconCircle}>
              <span style={{ fontSize: 24, color: 'var(--color-accent)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="40px" height="40px" viewBox="0 0 24 24">
                  <g>
                    <path fill="none" d="M0 0h24v24H0z"/>
                    <path d="M12 14v8H4a8 8 0 0 1 8-8zm0-1c-3.315 0-6-2.685-6-6s2.685-6 6-6 6 2.685 6 6-2.685 6-6 6zm9 4h1v5h-8v-5h1v-1a3 3 0 0 1 6 0v1zm-2 0v-1a1 1 0 0 0-2 0v1h2z"/>
                  </g>
                </svg>
              </span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
              {forgotSubmitted ? 'Check Your Email' : 'Forgot Password'}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>
              {forgotSubmitted
                ? 'If an admin account exists with this email, you will receive a password reset link shortly.'
                : 'Enter your admin email and we\'ll send a reset link.'}
            </p>
          </div>

          {error && (
            <div style={errorBox}>{error}</div>
          )}

          {!forgotSubmitted ? (
            <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={labelStyle}>Admin Email</label>
                <input
                  type="email" required value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  style={inputStyle}
                  placeholder="admin@neetzymee.com"
                />
              </div>
              <button
                type="submit" disabled={loading}
                style={{ ...buttonStyle, opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--color-text-3)', textAlign: 'center', marginTop: 'var(--space-2)' }}>
              Didn't receive it? Check your spam folder or try again.
            </div>
          )}

          <button
            onClick={() => { setForgotMode(false); setForgotSubmitted(false); setError(''); }}
            style={linkBtnStyle}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div style={iconCircle}>
            <span style={{ fontSize: 24, color: 'var(--color-accent)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40px" height="40px" viewBox="0 0 24 24">
                <g>
                    <path fill="none" d="M0 0h24v24H0z"/>
                    <path d="M12 14v8H4a8 8 0 0 1 8-8zm0-1c-3.315 0-6-2.685-6-6s2.685-6 6-6 6 2.685 6 6-2.685 6-6 6zm9 4h1v5h-8v-5h1v-1a3 3 0 0 1 6 0v1zm-2 0v-1a1 1 0 0 0-2 0v1h2z"/>
                </g>
              </svg>
            </span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Admin Login</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>NEET Zymee Admin Panel</p>
        </div>

        {/* Mode toggle */}
        <div style={toggleRow}>
          <button
            onClick={() => setMode('login')}
            style={{
              flex: 1, padding: 'var(--space-2)',
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: mode === 'login' ? 'var(--color-accent)' : 'transparent',
              color: mode === 'login' ? '#fff' : 'var(--color-text-2)',
              transition: 'background var(--transition-fast)',
            }}
          >Email Login</button>
          <button
            onClick={() => setMode('token')}
            style={{
              flex: 1, padding: 'var(--space-2)',
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: mode === 'token' ? 'var(--color-accent)' : 'transparent',
              color: mode === 'token' ? '#fff' : 'var(--color-text-2)',
              transition: 'background var(--transition-fast)',
            }}
          >Paste Token</button>
        </div>

        {error && (
          <div style={errorBox}>{error}</div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit" disabled={loading}
              style={{ ...buttonStyle, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => { setForgotMode(true); setError(''); }}
              style={linkBtnStyle}
            >
              Forgot Password?
            </button>
          </form>
        ) : (
          <form onSubmit={handleToken} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={labelStyle}>JWT Token</label>
              <textarea
                required value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                style={{ ...inputStyle, minHeight: 80, fontFamily: 'var(--font-mono)', fontSize: 12, resize: 'vertical' }}
                placeholder="Paste your JWT token from the mobile app"
              />
            </div>
            <button
              type="submit" disabled={loading}
              style={{ ...buttonStyle, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Verifying...' : 'Authenticate'}
            </button>
            <button
              type="button"
              onClick={() => { setForgotMode(true); setError(''); }}
              style={linkBtnStyle}
            >
              Forgot Password?
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  minHeight: '100vh', background: 'var(--color-paper-2)',
  padding: 'var(--space-4)',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--color-paper)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-8)',
  width: 400,
  maxWidth: '100%',
  boxShadow: 'var(--shadow-md)',
  border: '1px solid var(--color-border)',
};

const iconCircle: React.CSSProperties = {
  width: 48, height: 48, borderRadius: 14,
  background: 'var(--color-accent-muted)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  margin: '0 auto var(--space-3)',
};

const toggleRow: React.CSSProperties = {
  display: 'flex', gap: 0, marginBottom: 'var(--space-5)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)', overflow: 'hidden',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text)',
  marginBottom: 'var(--space-1)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 'var(--space-2) var(--space-3)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 14,
  outline: 'none',
  color: 'var(--color-text)',
  background: 'var(--color-paper-2)',
  boxSizing: 'border-box',
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: 'var(--space-3)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-accent)',
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const linkBtnStyle: React.CSSProperties = {
  width: '100%',
  background: 'none',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-2)',
  color: 'var(--color-accent)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  marginTop: 'var(--space-2)',
};

const errorBox: React.CSSProperties = {
  padding: 'var(--space-2) var(--space-3)',
  background: 'var(--color-danger-muted)',
  color: 'var(--color-danger)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 13,
  marginBottom: 'var(--space-4)',
  fontWeight: 500,
};
