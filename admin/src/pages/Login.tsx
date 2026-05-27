import { useState, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminLogin, loginWithToken } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tokenInput, setTokenInput] = useState(tokenParam || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'token'>(tokenParam ? 'token' : 'login');

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

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--color-paper-2)',
      padding: 'var(--space-4)',
    }}>
      <div style={{
        background: 'var(--color-paper)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-8)',
        width: 400,
        maxWidth: '100%',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--color-border)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'var(--color-accent-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-3)',
          }}>
            <span style={{ fontSize: 24, color: 'var(--color-accent)' }}>◆</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Admin Login</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>NEET Zyme Admin Panel</p>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: 'flex', gap: 0, marginBottom: 'var(--space-5)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', overflow: 'hidden',
        }}>
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
          <div style={{
            padding: 'var(--space-2) var(--space-3)',
            background: 'var(--color-danger-muted)',
            color: 'var(--color-danger)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            marginBottom: 'var(--space-4)',
            fontWeight: 500,
          }}>{error}</div>
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
              style={{
                ...buttonStyle,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
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
              style={{
                ...buttonStyle,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Verifying...' : 'Authenticate'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

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
